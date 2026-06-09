import {
  UserRoundPlus,
  TrendingUp,
  GraduationCap,
  Timer,
  UserRoundMinus,
  Users,
  Target,
  Award,
  CheckCircle2,
  Layers,
  GitPullRequestArrow,
  ThumbsUp,
} from "lucide-react";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { defineReport, type AnyReportDef } from "../types";
import {
  countBy,
  avgBy,
  byMonth,
  monthLabel,
  barSpec,
  pieSpec,
  lineSpec,
  radialSpec,
  radarSpec,
  funnelSpec,
} from "../charts";

function empName(b: LocaleBundle) {
  const m = new Map(b.employees.map((e) => [e.id, e.fullName]));
  return (id: string) => m.get(id) ?? id;
}

// ── Recruitment ───────────────────────────────────────────────────────────--
interface CandRow {
  name: string;
  role: string;
  stage: string;
  source: string;
  appliedAt: string;
  rating: string;
}
interface RawCand {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  jobPostingId?: string;
  stage?: string;
  source?: string;
  appliedAt?: string;
  rating?: number | null;
}
interface RawJob {
  id?: string;
  title?: string;
  status?: string;
}

const STAGE_ORDER = [
  "applied",
  "screening",
  "shortlisted",
  "assessment",
  "interview",
  "offer",
  "hired",
];

const recruitmentReport = defineReport<CandRow>({
  id: "recruitment",
  label: "Recruitment",
  description: "Candidate pipeline by stage, source and outcome.",
  icon: UserRoundPlus,
  group: "Talent",
  permission: "talent.recruitment",
  select: (b) => {
    const rec = (b.recruitment ?? {}) as { candidates?: RawCand[]; jobPostings?: RawJob[] };
    const jobs = new Map((rec.jobPostings ?? []).map((j) => [j.id ?? "", j.title ?? "—"]));
    return (rec.candidates ?? []).map((c) => ({
      name:
        c.fullName ??
        c.name ??
        (`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—"),
      role: jobs.get(c.jobPostingId ?? "") ?? "—",
      stage: c.stage ?? "applied",
      source: c.source ?? "—",
      appliedAt: c.appliedAt ?? "—",
      rating: c.rating != null ? String(c.rating) : "—",
    }));
  },
  columns: [
    { key: "name", header: "Candidate", value: (r) => r.name },
    { key: "role", header: "Role", value: (r) => r.role },
    { key: "stage", header: "Stage", value: (r) => r.stage },
    { key: "source", header: "Source", value: (r) => r.source },
    { key: "appliedAt", header: "Applied", value: (r) => r.appliedAt },
    { key: "rating", header: "Rating", value: (r) => r.rating },
  ],
  filters: [
    {
      key: "stage",
      label: "Stage",
      options: (rows) => [...new Set(rows.map((r) => r.stage))],
      match: (r, v) => r.stage === v,
    },
    {
      key: "source",
      label: "Source",
      options: (rows) => [...new Set(rows.map((r) => r.source))],
      match: (r, v) => r.source === v,
    },
  ],
  searchText: (r) => `${r.name} ${r.role} ${r.source}`,
  analytics: (rows) => {
    const hired = rows.filter((r) => r.stage === "hired").length;
    const inPipeline = rows.filter((r) => !["hired", "rejected"].includes(r.stage)).length;
    const stageCounts = new Map(countBy(rows, (r) => r.stage).map((t) => [t.label, t.value]));
    const funnel = STAGE_ORDER.filter((s) => stageCounts.has(s)).map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: stageCounts.get(s) ?? 0,
    }));
    const months = byMonth(rows, (r) => r.appliedAt);
    return {
      stats: [
        { label: "Candidates", value: rows.length, sub: "In the pipeline", icon: Users },
        {
          label: "Hired",
          value: hired,
          sub: `${Math.round((hired / (rows.length || 1)) * 100)}% conversion`,
          icon: CheckCircle2,
          trend: `${hired}`,
          up: true,
        },
        { label: "In Pipeline", value: inPipeline, sub: "Active candidates", icon: GitPullRequestArrow },
        { label: "Sources", value: new Set(rows.map((r) => r.source)).size, sub: "Channels used", icon: Layers },
      ],
      charts: [
        funnelSpec("Hiring Pipeline", funnel, {
          fullWidth: true,
          description: "Candidates progressing through each recruitment stage.",
          footer: `${hired} hired from ${rows.length} applicants.`,
        }),
        pieSpec("rec-source", "Candidates by Source", countBy(rows, (r) => r.source), {
          centerLabel: "Candidates",
          description: "Where applicants are coming from.",
        }),
        barSpec("Candidates by Role", countBy(rows, (r) => r.role), {
          valueLabel: "Candidates",
          description: "Demand across open roles.",
        }),
        barSpec("Rating Distribution", countBy(rows, (r) => `${r.rating} ★`), {
          valueLabel: "Candidates",
          layout: "horizontal",
          description: "Spread of candidate evaluation scores.",
        }),
        lineSpec(
          "Applications by Month",
          months.map((m) => ({ month: monthLabel(m.label), applications: m.value })),
          [{ key: "applications", label: "Applications", color: "#3b82f6" }],
          "month",
          "line",
          { fullWidth: true, description: "Application volume trend over time." },
        ),
        radialSpec(
          "Pipeline vs Hired",
          [
            { key: "hired", label: "Hired", value: hired, color: "#4ED251" },
            { key: "pipeline", label: "In Pipeline", value: inPipeline, color: "#ff8b2d" },
            {
              key: "rejected",
              label: "Rejected",
              value: rows.filter((r) => r.stage === "rejected").length,
              color: "#f43f5e",
            },
          ],
          { centerLabel: "Candidates", description: "Outcome distribution of all candidates." },
        ),
      ],
    };
  },
});

// ── Performance ───────────────────────────────────────────────────────────--
interface ReviewRow {
  employee: string;
  cycle: string;
  self: number;
  manager: number;
  calibrated: number;
  completedAt: string;
}
interface RawReview {
  employeeId?: string;
  cycleId?: string;
  selfRating?: number;
  managerRating?: number;
  calibratedRating?: number;
  completedAt?: string;
}
interface RawGoal {
  status?: string;
}

const performanceReport = defineReport<ReviewRow>({
  id: "performance",
  label: "Performance",
  description: "Review ratings, calibration and goal progress.",
  icon: TrendingUp,
  group: "Talent",
  permission: "talent.performance",
  select: (b) => {
    const name = empName(b);
    const perf = (b.performance ?? {}) as { reviews?: RawReview[] };
    return (perf.reviews ?? []).map((r) => ({
      employee: name(r.employeeId ?? ""),
      cycle: r.cycleId ?? "—",
      self: r.selfRating ?? 0,
      manager: r.managerRating ?? 0,
      calibrated: r.calibratedRating ?? 0,
      completedAt: r.completedAt ?? "—",
    }));
  },
  columns: [
    { key: "employee", header: "Employee", value: (r) => r.employee },
    { key: "cycle", header: "Cycle", value: (r) => r.cycle },
    { key: "self", header: "Self", value: (r) => r.self },
    { key: "manager", header: "Manager", value: (r) => r.manager },
    { key: "calibrated", header: "Calibrated", value: (r) => r.calibrated },
    { key: "completedAt", header: "Completed", value: (r) => r.completedAt },
  ],
  filters: [
    {
      key: "cycle",
      label: "Cycle",
      options: (rows) => [...new Set(rows.map((r) => r.cycle))],
      match: (r, v) => r.cycle === v,
    },
  ],
  searchText: (r) => `${r.employee} ${r.cycle}`,
  analytics: (rows, b) => {
    const perf = (b.performance ?? {}) as { goals?: RawGoal[] };
    const goals = perf.goals ?? [];
    const onTrack = goals.filter((g) => g.status === "on_track").length;
    const avg =
      rows.length > 0
        ? Math.round((rows.reduce((s, r) => s + r.calibrated, 0) / rows.length) * 10) / 10
        : 0;
    const cycles = [...new Set(rows.map((r) => r.cycle))];
    const radarData = cycles.map((cycle) => {
      const inCycle = rows.filter((r) => r.cycle === cycle);
      const mean = (sel: (r: ReviewRow) => number) =>
        Math.round((inCycle.reduce((s, r) => s + sel(r), 0) / (inCycle.length || 1)) * 10) /
        10;
      return {
        cycle,
        self: mean((r) => r.self),
        manager: mean((r) => r.manager),
        calibrated: mean((r) => r.calibrated),
      };
    });
    const avgByCycle = avgBy(rows, (r) => r.cycle, (r) => r.calibrated).sort((a, z) =>
      a.label.localeCompare(z.label),
    );
    return {
      stats: [
        { label: "Reviews", value: rows.length, sub: "Completed appraisals", icon: TrendingUp },
        { label: "Avg Calibrated", value: avg, sub: "Mean final rating", icon: Award },
        { label: "Goals", value: goals.length, sub: "Tracked objectives", icon: Target },
        {
          label: "On Track",
          value: onTrack,
          sub: `${Math.round((onTrack / (goals.length || 1)) * 100)}% of goals`,
          icon: CheckCircle2,
          trend: `${onTrack}`,
          up: true,
        },
      ],
      charts: [
        barSpec(
          "Calibrated Rating Distribution",
          countBy(rows, (r) => `${r.calibrated} ★`),
          { valueLabel: "Reviews", layout: "horizontal", description: "How final ratings are spread." },
        ),
        pieSpec("perf-goals", "Goal Status", countBy(goals, (g) => g.status), {
          centerLabel: "Goals",
          description: "Progress status across all goals.",
        }),
        radarSpec(
          "Self vs Manager vs Calibrated",
          radarData,
          [
            { key: "self", label: "Self", color: "#3b82f6" },
            { key: "manager", label: "Manager", color: "#ff8b2d" },
            { key: "calibrated", label: "Calibrated", color: "#4ED251" },
          ],
          "cycle",
          { description: "Average rating by source across review cycles." },
        ),
        barSpec("Reviews by Cycle", countBy(rows, (r) => r.cycle), {
          valueLabel: "Reviews",
          description: "Appraisal volume per cycle.",
        }),
        lineSpec(
          "Avg Calibrated by Cycle",
          avgByCycle.map((c) => ({ cycle: c.label, rating: c.value })),
          [{ key: "rating", label: "Avg Rating", color: "#a855f7" }],
          "cycle",
          "line",
          { fullWidth: true, description: "Trend of mean calibrated rating over cycles." },
        ),
        radialSpec(
          "Goal On-Track Rate",
          [
            { key: "ontrack", label: "On Track", value: onTrack, color: "#4ED251" },
            {
              key: "off",
              label: "At Risk / Off",
              value: Math.max(0, goals.length - onTrack),
              color: "#f43f5e",
            },
          ],
          { centerLabel: "Goals", description: "Goals on track vs at risk." },
        ),
      ],
    };
  },
});

// ── Learning / Training ───────────────────────────────────────────────────--
interface EnrolRow {
  employee: string;
  course: string;
  category: string;
  status: string;
  progress: number;
  enrolledAt: string;
}
interface RawCourse {
  id?: string;
  title?: string;
  category?: string;
}
interface RawEnrol {
  employeeId?: string;
  courseId?: string;
  courseTitle?: string;
  status?: string;
  progress?: number;
  enrolledAt?: string;
}

function progressBucket(p: number): string {
  if (p >= 100) return "Complete";
  if (p >= 75) return "76–99%";
  if (p >= 50) return "50–75%";
  if (p >= 25) return "25–49%";
  return "Under 25%";
}

const learningReport = defineReport<EnrolRow>({
  id: "learning",
  label: "Learning & Training",
  description: "Course enrolments, progress and completion.",
  icon: GraduationCap,
  group: "Talent",
  permission: "talent.training",
  select: (b) => {
    const name = empName(b);
    const learning = (b.learning ?? {}) as { courses?: RawCourse[]; enrollments?: RawEnrol[] };
    const cat = new Map((learning.courses ?? []).map((c) => [c.id ?? "", c.category ?? "—"]));
    return (learning.enrollments ?? []).map((e) => ({
      employee: name(e.employeeId ?? ""),
      course: e.courseTitle ?? "—",
      category: cat.get(e.courseId ?? "") ?? "—",
      status: e.status ?? "—",
      progress: e.progress ?? 0,
      enrolledAt: e.enrolledAt ?? "—",
    }));
  },
  columns: [
    { key: "employee", header: "Employee", value: (r) => r.employee },
    { key: "course", header: "Course", value: (r) => r.course },
    { key: "category", header: "Category", value: (r) => r.category },
    { key: "status", header: "Status", value: (r) => r.status },
    { key: "progress", header: "Progress %", value: (r) => r.progress },
    { key: "enrolledAt", header: "Enrolled", value: (r) => r.enrolledAt },
  ],
  filters: [
    {
      key: "status",
      label: "Status",
      options: (rows) => [...new Set(rows.map((r) => r.status))],
      match: (r, v) => r.status === v,
    },
    {
      key: "category",
      label: "Category",
      options: (rows) => [...new Set(rows.map((r) => r.category))],
      match: (r, v) => r.category === v,
    },
  ],
  searchText: (r) => `${r.employee} ${r.course} ${r.category}`,
  analytics: (rows) => {
    const completed = rows.filter((r) => r.status === "completed").length;
    const avgProgress = Math.round(
      rows.reduce((s, r) => s + r.progress, 0) / (rows.length || 1),
    );
    const months = byMonth(rows, (r) => r.enrolledAt);
    return {
      stats: [
        { label: "Enrolments", value: rows.length, sub: "Total course sign-ups", icon: GraduationCap },
        {
          label: "Completed",
          value: completed,
          sub: `${Math.round((completed / (rows.length || 1)) * 100)}% completion`,
          icon: CheckCircle2,
          trend: `${completed}`,
          up: true,
        },
        { label: "Avg Progress", value: `${avgProgress}%`, sub: "Across enrolments", icon: TrendingUp },
        { label: "Courses", value: new Set(rows.map((r) => r.course)).size, sub: "Distinct courses", icon: Layers },
      ],
      charts: [
        pieSpec("learn-status", "Enrolment Status", countBy(rows, (r) => r.status), {
          centerLabel: "Enrolments",
          description: "Completion workflow distribution.",
        }),
        barSpec("Enrolments by Category", countBy(rows, (r) => r.category), {
          valueLabel: "Enrolments",
          description: "Most popular learning categories.",
        }),
        barSpec("Progress Distribution", countBy(rows, (r) => progressBucket(r.progress)), {
          valueLabel: "Enrolments",
          layout: "horizontal",
          description: "How far learners have progressed.",
        }),
        barSpec("Top Courses", countBy(rows, (r) => r.course).slice(0, 8), {
          valueLabel: "Enrolments",
          description: "Courses with the most enrolments.",
        }),
        lineSpec(
          "Enrolments by Month",
          months.map((m) => ({ month: monthLabel(m.label), enrolments: m.value })),
          [{ key: "enrolments", label: "Enrolments", color: "#14b8a6" }],
          "month",
          "area",
          { fullWidth: true, description: "Learning uptake trend over time." },
        ),
        radialSpec(
          "Completion Rate",
          [
            { key: "completed", label: "Completed", value: completed, color: "#4ED251" },
            {
              key: "inprogress",
              label: "In Progress / Other",
              value: Math.max(0, rows.length - completed),
              color: "#ff8b2d",
            },
          ],
          { centerLabel: "Enrolments", description: "Completed vs in-progress courses." },
        ),
      ],
    };
  },
});

// ── Onboarding (recent hires) ─────────────────────────────────────────────--
interface HireRow {
  employee: string;
  department: string;
  jobTitle: string;
  employmentType: string;
  grade: string;
  startDate: string;
}

const onboardingReport = defineReport<HireRow>({
  id: "onboarding",
  label: "Onboarding",
  description: "New hires in the last 12 months by department.",
  icon: Timer,
  group: "Talent",
  permission: "talent.onboarding",
  select: (b) => {
    const types = new Map(b.employmentTypes.map((t) => [t.id, t.name]));
    const ref = b._meta?.referenceDate ? new Date(b._meta.referenceDate) : new Date();
    const yearAgo = new Date(ref);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    return b.employees
      .filter((e) => e.startDate && new Date(e.startDate) >= yearAgo)
      .map((e) => ({
        employee: e.fullName,
        department: e.departmentName,
        jobTitle: e.jobTitle,
        employmentType: types.get(e.employmentTypeId) ?? e.employmentTypeId,
        grade: e.grade ?? "—",
        startDate: e.startDate,
      }));
  },
  columns: [
    { key: "employee", header: "Employee", value: (r) => r.employee },
    { key: "department", header: "Department", value: (r) => r.department },
    { key: "jobTitle", header: "Job Title", value: (r) => r.jobTitle },
    { key: "employmentType", header: "Type", value: (r) => r.employmentType },
    { key: "grade", header: "Grade", value: (r) => r.grade },
    { key: "startDate", header: "Start Date", value: (r) => r.startDate },
  ],
  filters: [
    {
      key: "department",
      label: "Department",
      options: (rows) => [...new Set(rows.map((r) => r.department))],
      match: (r, v) => r.department === v,
    },
  ],
  searchText: (r) => `${r.employee} ${r.department} ${r.jobTitle}`,
  analytics: (rows) => {
    const months = byMonth(rows, (r) => r.startDate);
    const ft = rows.filter((r) => /full/i.test(r.employmentType)).length;
    return {
      stats: [
        { label: "New Hires (12mo)", value: rows.length, sub: "Joined in last year", icon: UserRoundPlus },
        { label: "Departments", value: new Set(rows.map((r) => r.department)).size, sub: "Receiving hires", icon: Users },
        { label: "Full-time", value: ft, sub: `${Math.round((ft / (rows.length || 1)) * 100)}% of hires`, icon: CheckCircle2 },
        { label: "Roles", value: new Set(rows.map((r) => r.jobTitle)).size, sub: "Distinct job titles", icon: Layers },
      ],
      charts: [
        barSpec("Hires by Department", countBy(rows, (r) => r.department), {
          valueLabel: "Hires",
          description: "Which teams grew the most.",
        }),
        pieSpec("onb-type", "Hires by Employment Type", countBy(rows, (r) => r.employmentType), {
          centerLabel: "Hires",
          description: "Contract type of new joiners.",
        }),
        barSpec("Hires by Job Title", countBy(rows, (r) => r.jobTitle).slice(0, 8), {
          valueLabel: "Hires",
          layout: "horizontal",
          description: "Most-hired roles this year.",
        }),
        barSpec("Hires by Grade", countBy(rows, (r) => r.grade), {
          valueLabel: "Hires",
          layout: "horizontal",
          description: "Seniority mix of new hires.",
        }),
        lineSpec(
          "Hires by Month",
          months.map((m) => ({ month: monthLabel(m.label), hires: m.value })),
          [{ key: "hires", label: "Hires", color: "#4ED251" }],
          "month",
          "area",
          { fullWidth: true, description: "Hiring momentum across the year." },
        ),
        radialSpec(
          "Employment Type Mix",
          countBy(rows, (r) => r.employmentType).map((t, i) => ({
            key: `t${i}`,
            label: t.label,
            value: t.value,
            color: ["#4ED251", "#ff8b2d", "#3b82f6", "#a855f7", "#14b8a6"][i % 5],
          })),
          { centerLabel: "Hires", description: "Concentration of hire types." },
        ),
      ],
    };
  },
});

// ── Offboarding ───────────────────────────────────────────────────────────--
interface OffRow {
  employee: string;
  lastDay: string;
  reason: string;
  clearance: string;
  recommend: string;
}
interface RawOff {
  employeeName?: string;
  lastDay?: string;
  reason?: string;
  clearance?: Record<string, string>;
  exitInterview?: { wouldRecommend?: boolean };
}

const offboardingReport = defineReport<OffRow>({
  id: "offboarding",
  label: "Offboarding",
  description: "Leavers, exit reasons and clearance progress.",
  icon: UserRoundMinus,
  group: "Talent",
  permission: "talent.offboarding",
  select: (b) =>
    ((b.offboarding ?? []) as RawOff[]).map((o) => {
      const clr = o.clearance ?? {};
      const done = Object.values(clr).filter((v) => v === "completed").length;
      return {
        employee: o.employeeName ?? "—",
        lastDay: o.lastDay ?? "—",
        reason: o.reason ?? "—",
        clearance: `${done}/${Object.keys(clr).length || 4}`,
        recommend:
          o.exitInterview?.wouldRecommend == null
            ? "—"
            : o.exitInterview.wouldRecommend
              ? "Yes"
              : "No",
      };
    }),
  columns: [
    { key: "employee", header: "Employee", value: (r) => r.employee },
    { key: "lastDay", header: "Last Day", value: (r) => r.lastDay },
    { key: "reason", header: "Reason", value: (r) => r.reason },
    { key: "clearance", header: "Clearance", value: (r) => r.clearance },
    { key: "recommend", header: "Would Recommend", value: (r) => r.recommend },
  ],
  filters: [
    {
      key: "reason",
      label: "Reason",
      options: (rows) => [...new Set(rows.map((r) => r.reason))],
      match: (r, v) => r.reason === v,
    },
  ],
  searchText: (r) => `${r.employee} ${r.reason}`,
  analytics: (rows) => {
    const isComplete = (c: string) => {
      const [a, b2] = c.split("/");
      return a === b2;
    };
    const cleared = rows.filter((r) => isComplete(r.clearance)).length;
    const recommend = rows.filter((r) => r.recommend === "Yes").length;
    const months = byMonth(rows, (r) => r.lastDay);
    return {
      stats: [
        { label: "Leavers", value: rows.length, sub: "Total exits", icon: UserRoundMinus },
        { label: "Clearance Done", value: cleared, sub: `${Math.round((cleared / (rows.length || 1)) * 100)}% complete`, icon: CheckCircle2 },
        { label: "Would Recommend", value: recommend, sub: "Positive exit sentiment", icon: ThumbsUp, trend: `${recommend}`, up: true },
        { label: "Exit Reasons", value: new Set(rows.map((r) => r.reason)).size, sub: "Distinct reasons", icon: Layers },
      ],
      charts: [
        pieSpec("off-reason", "Exit Reasons", countBy(rows, (r) => r.reason), {
          centerLabel: "Leavers",
          description: "Why employees are leaving.",
        }),
        barSpec("Would Recommend", countBy(rows, (r) => r.recommend), {
          valueLabel: "Leavers",
          layout: "horizontal",
          description: "Exit-interview recommendation sentiment.",
        }),
        pieSpec(
          "off-clearance",
          "Clearance Status",
          [
            { label: "Complete", value: cleared },
            { label: "In Progress", value: Math.max(0, rows.length - cleared) },
          ],
          { centerLabel: "Leavers", description: "Offboarding clearance completion." },
        ),
        barSpec("Leavers by Reason", countBy(rows, (r) => r.reason).slice(0, 8), {
          valueLabel: "Leavers",
          description: "Ranked exit reasons.",
        }),
        lineSpec(
          "Leavers by Month",
          months.map((m) => ({ month: monthLabel(m.label), leavers: m.value })),
          [{ key: "leavers", label: "Leavers", color: "#f43f5e" }],
          "month",
          "area",
          { fullWidth: true, description: "Attrition trend over time." },
        ),
        radialSpec(
          "Recommendation Rate",
          [
            { key: "yes", label: "Would Recommend", value: recommend, color: "#4ED251" },
            {
              key: "no",
              label: "Would Not / N/A",
              value: Math.max(0, rows.length - recommend),
              color: "#f43f5e",
            },
          ],
          { centerLabel: "Leavers", description: "Share of positive exit sentiment." },
        ),
      ],
    };
  },
});

export const TALENT_REPORTS: AnyReportDef[] = [
  recruitmentReport,
  performanceReport,
  learningReport,
  onboardingReport,
  offboardingReport,
];
