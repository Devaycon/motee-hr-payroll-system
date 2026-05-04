"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Heart,
  Users,
  Landmark,
  Umbrella,
  Eye,
  Plus,
  Check,
  X,
  Trash2,
  AlertCircle,
  FileText,
  Download,
  Pencil,
  ChevronRight,
  Info,
  CalendarDays,
  BadgeCheck,
  Clock,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type BenefitType =
  | "health"
  | "life"
  | "pension"
  | "dental"
  | "vision"
  | "welfare"
  | "other";
type EnrollStatus = "enrolled" | "pending" | "rejected" | "not_enrolled";

interface Dependent {
  id: string;
  name: string;
  relationship: string;
  dob: string;
}

interface BenefitPlan {
  id: string;
  name: string;
  type: BenefitType;
  provider: string;
  description: string;
  coverageDetails: string;
  employeeContribution: number;
  companyContribution: number;
  contributionMode: "fixed" | "percent";
  enrollmentStart: string;
  enrollmentEnd: string;
  allowDependents: boolean;
  enrollStatus: EnrollStatus;
  enrolled: boolean;
  dependents: Dependent[];
  policyDocUrl?: string;
}

interface LifeEvent {
  type: string;
  description: string;
  date: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  BenefitType,
  { label: string; icon: React.ElementType; bg: string; text: string }
> = {
  health: {
    label: "Health Insurance",
    icon: Heart,
    bg: "#EF4444",
    text: "#EF4444",
  },
  life: {
    label: "Life Insurance",
    icon: ShieldCheck,
    bg: "#7F77DD",
    text: "#7F77DD",
  },
  pension: { label: "Pension", icon: Landmark, bg: "#1D9E75", text: "#1D9E75" },
  dental: { label: "Dental", icon: BadgeCheck, bg: "#2563EB", text: "#2563EB" },
  vision: { label: "Vision", icon: Eye, bg: "#7C3AED", text: "#7C3AED" },
  welfare: {
    label: "Employee Welfare",
    icon: Users,
    bg: "#D97706",
    text: "#D97706",
  },
  other: { label: "Other", icon: Umbrella, bg: "#6B7280", text: "#6B7280" },
};

const ENROLL_STYLES: Record<EnrollStatus, string> = {
  enrolled: "border-[#1D9E75]/30 bg-[#1D9E75]/10 text-[#1D9E75]",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  rejected: "border-red-500/30 bg-red-500/10 text-red-600",
  not_enrolled: "border-slate-400/30 bg-slate-400/10 text-slate-500",
};
const ENROLL_LABELS: Record<EnrollStatus, string> = {
  enrolled: "Enrolled",
  pending: "Pending Approval",
  rejected: "Rejected",
  not_enrolled: "Not Enrolled",
};

const LIFE_EVENT_TYPES = [
  "Marriage",
  "Divorce",
  "New Child (Birth)",
  "New Child (Adoption)",
  "Spouse Lost Employment",
  "Change of Address",
  "Other",
];
const RELATIONSHIP_OPTIONS = ["Spouse", "Child", "Parent", "Sibling", "Other"];

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_PLANS: BenefitPlan[] = [
  {
    id: "bp-001",
    name: "AIICO Health Shield — Gold",
    type: "health",
    provider: "AIICO Insurance Plc",
    description:
      "Comprehensive health insurance covering inpatient, outpatient, maternity, and specialist care for the employee and dependents.",
    coverageDetails:
      "Inpatient: ₦5,000,000/yr · Outpatient: ₦500,000/yr · Maternity: ₦300,000 · Dental: ₦50,000",
    employeeContribution: 15000,
    companyContribution: 45000,
    contributionMode: "fixed",
    enrollmentStart: "2024-01-01",
    enrollmentEnd: "2024-12-31",
    allowDependents: true,
    enrollStatus: "enrolled",
    enrolled: true,
    dependents: [
      {
        id: "dep-001",
        name: "Mrs. Adeyemi (Spouse)",
        relationship: "Spouse",
        dob: "1994-05-12",
      },
    ],
    policyDocUrl: "/docs/health-policy.pdf",
  },
  {
    id: "bp-002",
    name: "Pension Fund — Stanbic IBTC",
    type: "pension",
    provider: "Stanbic IBTC Pension Managers",
    description:
      "Mandatory contributory pension scheme. Employee contributes 8% of gross; company contributes 10%.",
    coverageDetails:
      "Employee: 8% of gross · Company: 10% of gross · Vesting: immediate",
    employeeContribution: 36000,
    companyContribution: 45000,
    contributionMode: "percent",
    enrollmentStart: "2022-03-15",
    enrollmentEnd: "2099-12-31",
    allowDependents: false,
    enrollStatus: "enrolled",
    enrolled: true,
    dependents: [],
    policyDocUrl: "/docs/pension-scheme.pdf",
  },
  {
    id: "bp-003",
    name: "Group Life Insurance",
    type: "life",
    provider: "Leadway Assurance",
    description:
      "Group life insurance providing 3x annual gross salary benefit to next of kin on death in service.",
    coverageDetails:
      "Death in Service: 3× annual gross · Permanent Disability: 2× annual gross",
    employeeContribution: 0,
    companyContribution: 5400,
    contributionMode: "fixed",
    enrollmentStart: "2022-03-15",
    enrollmentEnd: "2099-12-31",
    allowDependents: false,
    enrollStatus: "enrolled",
    enrolled: true,
    dependents: [],
    policyDocUrl: "/docs/group-life.pdf",
  },
  {
    id: "bp-004",
    name: "Dental & Vision Care",
    type: "dental",
    provider: "Hygeia HMO",
    description:
      "Supplemental dental and vision plan covering routine checkups, fillings, corrective lenses, and frames.",
    coverageDetails:
      "Dental: ₦80,000/yr · Vision: ₦60,000/yr · Annual checkup: covered",
    employeeContribution: 5000,
    companyContribution: 10000,
    contributionMode: "fixed",
    enrollmentStart: "2026-04-01",
    enrollmentEnd: "2026-04-30",
    allowDependents: true,
    enrollStatus: "not_enrolled",
    enrolled: false,
    dependents: [],
  },
  {
    id: "bp-005",
    name: "Employee Wellness & EAP",
    type: "welfare",
    provider: "Motee Wellness",
    description:
      "Employee Assistance Programme covering counselling sessions, mental health support, gym subsidies, and wellness allowances.",
    coverageDetails:
      "Counselling: 6 sessions/yr · Gym subsidy: ₦20,000/yr · Mental health app: free access",
    employeeContribution: 0,
    companyContribution: 8000,
    contributionMode: "fixed",
    enrollmentStart: "2026-05-01",
    enrollmentEnd: "2026-05-31",
    allowDependents: false,
    enrollStatus: "pending",
    enrolled: false,
    dependents: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function isOpenEnrollment(plan: BenefitPlan) {
  const now = Date.now();
  return (
    new Date(plan.enrollmentStart).getTime() <= now &&
    new Date(plan.enrollmentEnd).getTime() >= now
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MyBenefitsPage() {
  const [plans, setPlans] = useState<BenefitPlan[]>(DEMO_PLANS);

  const [detailPlan, setDetailPlan] = useState<BenefitPlan | null>(null);
  const [enrollPlan, setEnrollPlan] = useState<BenefitPlan | null>(null);
  const [lifeEventOpen, setLifeEventOpen] = useState(false);

  const [enrollNote, setEnrollNote] = useState("");
  const [enrollDone, setEnrollDone] = useState(false);

  const [leType, setLeType] = useState("");
  const [leDate, setLeDate] = useState("");
  const [leDesc, setLeDesc] = useState("");
  const [leDone, setLeDone] = useState(false);

  const [addDepOpen, setAddDepOpen] = useState(false);
  const [depName, setDepName] = useState("");
  const [depRel, setDepRel] = useState("");
  const [depDob, setDepDob] = useState("");

  const enrolled = plans.filter((p) => p.enrolled);
  const available = plans.filter(
    (p) => !p.enrolled && p.enrollStatus !== "pending",
  );
  const pending = plans.filter((p) => p.enrollStatus === "pending");

  const openEnrollmentActive = plans.some(
    (p) => !p.enrolled && isOpenEnrollment(p),
  );

  function handleEnrollSubmit() {
    if (!enrollPlan) return;
    setPlans((prev) =>
      prev.map((p) =>
        p.id === enrollPlan.id ? { ...p, enrollStatus: "pending" } : p,
      ),
    );
    setEnrollDone(true);
    setTimeout(() => {
      setEnrollDone(false);
      setEnrollNote("");
      setEnrollPlan(null);
    }, 1500);
  }

  function handleLifeEventSubmit() {
    if (!leType) return;
    setLeDone(true);
    setTimeout(() => {
      setLeDone(false);
      setLeType("");
      setLeDate("");
      setLeDesc("");
      setLifeEventOpen(false);
    }, 1500);
  }

  function handleAddDependent() {
    if (!detailPlan || !depName || !depRel) return;
    const newDep: Dependent = {
      id: `dep-${Date.now()}`,
      name: depName,
      relationship: depRel,
      dob: depDob,
    };
    setPlans((prev) =>
      prev.map((p) =>
        p.id === detailPlan.id
          ? { ...p, dependents: [...p.dependents, newDep] }
          : p,
      ),
    );
    const updated = plans.find((p) => p.id === detailPlan.id);
    if (updated)
      setDetailPlan({
        ...updated,
        dependents: [...updated.dependents, newDep],
      });
    setAddDepOpen(false);
    setDepName("");
    setDepRel("");
    setDepDob("");
  }

  function handleRemoveDependent(planId: string, depId: string) {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, dependents: p.dependents.filter((d) => d.id !== depId) }
          : p,
      ),
    );
    if (detailPlan?.id === planId) {
      setDetailPlan((prev) =>
        prev
          ? {
              ...prev,
              dependents: prev.dependents.filter((d) => d.id !== depId),
            }
          : prev,
      );
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">My Benefits</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View, manage, and enroll in your company benefit plans.
        </p>
      </div>

      {/* Open Enrollment Banner */}
      {openEnrollmentActive && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#7F77DD]/10 border border-[#7F77DD]/30">
          <CalendarDays className="w-4 h-4 text-[#7F77DD] shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#7F77DD]">
              Open Enrollment is Active
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              New benefit plans are available for enrollment. Review and request
              before the enrollment window closes.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-[#7F77DD]/40 text-[#7F77DD] hover:bg-[#7F77DD]/10 shrink-0"
            onClick={() => setLifeEventOpen(true)}
          >
            Submit Life Event
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Enrolled Plans",
            value: enrolled.length,
            icon: BadgeCheck,
            color: "#1D9E75",
          },
          {
            label: "Pending Approval",
            value: pending.length,
            icon: Clock,
            color: "#F59E0B",
          },
          {
            label: "Available to Join",
            value: available.length,
            icon: Plus,
            color: "#7F77DD",
          },
          {
            label: "Monthly Cost (You)",
            value: formatCurrency(
              enrolled.reduce((s, p) => s + p.employeeContribution, 0),
            ),
            icon: Landmark,
            color: "#2563EB",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${s.color}18` }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">
                  {s.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enrolled Benefits */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Enrolled Plans
        </p>
        {enrolled.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4">
            You are not enrolled in any benefit plans yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolled.map((plan) => (
              <BenefitCard key={plan.id} plan={plan} onView={setDetailPlan} />
            ))}
          </div>
        )}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Pending Enrollment Approval
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map((plan) => (
              <BenefitCard key={plan.id} plan={plan} onView={setDetailPlan} />
            ))}
          </div>
        </div>
      )}

      {/* Available */}
      {available.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Available to Enroll
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((plan) => (
              <BenefitCard
                key={plan.id}
                plan={plan}
                onView={setDetailPlan}
                onEnroll={setEnrollPlan}
              />
            ))}
          </div>
        </div>
      )}

      {/* Life event button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setLifeEventOpen(true)}
        >
          <Send className="w-3.5 h-3.5" /> Submit a Life Event
        </Button>
      </div>

      {/* ── Detail Modal ── */}
      <Dialog open={!!detailPlan} onOpenChange={() => setDetailPlan(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {detailPlan && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `${TYPE_CONFIG[detailPlan.type].bg}18`,
                    }}
                  >
                    {(() => {
                      const Icon = TYPE_CONFIG[detailPlan.type].icon;
                      return (
                        <Icon
                          className="w-5 h-5"
                          style={{ color: TYPE_CONFIG[detailPlan.type].text }}
                        />
                      );
                    })()}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-sm font-semibold truncate">
                      {detailPlan.name}
                    </DialogTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {detailPlan.provider}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ml-auto",
                      ENROLL_STYLES[detailPlan.enrollStatus],
                    )}
                  >
                    {ENROLL_LABELS[detailPlan.enrollStatus]}
                  </span>
                </div>
              </DialogHeader>

              <div className="flex flex-col gap-4 py-1">
                <p className="text-xs text-muted-foreground">
                  {detailPlan.description}
                </p>

                {/* Coverage */}
                <div className="rounded-lg bg-muted/40 border border-border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Coverage Details
                  </p>
                  <p className="text-xs text-foreground">
                    {detailPlan.coverageDetails}
                  </p>
                </div>

                {/* Contributions */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">
                    Contributions
                  </p>
                  <div className="flex flex-col">
                    {[
                      {
                        label: "Your contribution",
                        value:
                          detailPlan.contributionMode === "percent"
                            ? `${((detailPlan.employeeContribution / 450000) * 100).toFixed(0)}% of gross`
                            : formatCurrency(detailPlan.employeeContribution) +
                              "/mo",
                      },
                      {
                        label: "Company contribution",
                        value:
                          detailPlan.contributionMode === "percent"
                            ? `${((detailPlan.companyContribution / 450000) * 100).toFixed(0)}% of gross`
                            : formatCurrency(detailPlan.companyContribution) +
                              "/mo",
                      },
                      {
                        label: "Total monthly cost",
                        value:
                          formatCurrency(
                            detailPlan.employeeContribution +
                              detailPlan.companyContribution,
                          ) + "/mo",
                      },
                    ].map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                      >
                        <span className="text-[11px] text-muted-foreground">
                          {r.label}
                        </span>
                        <span className="text-[11px] font-medium text-foreground">
                          {r.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enrollment dates */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Enrollment:{" "}
                    {formatDate(detailPlan.enrollmentStart)} –{" "}
                    {formatDate(detailPlan.enrollmentEnd)}
                  </span>
                </div>

                <Separator />

                {/* Dependents */}
                {detailPlan.allowDependents && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-foreground">
                        Dependents ({detailPlan.dependents.length})
                      </p>
                      {detailPlan.enrolled && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => setAddDepOpen(true)}
                        >
                          <Plus className="w-3 h-3" /> Add
                        </Button>
                      )}
                    </div>
                    {detailPlan.dependents.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground py-2">
                        No dependents added.
                      </p>
                    ) : (
                      <div className="flex flex-col">
                        {detailPlan.dependents.map((dep) => (
                          <div
                            key={dep.id}
                            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#7F77DD]/10 flex items-center justify-center shrink-0">
                                <Users className="w-3.5 h-3.5 text-[#7F77DD]" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground">
                                  {dep.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {dep.relationship}
                                  {dep.dob
                                    ? ` · DOB: ${formatDate(dep.dob)}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                            {detailPlan.enrolled && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-red-500"
                                onClick={() =>
                                  handleRemoveDependent(detailPlan.id, dep.id)
                                }
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Policy doc */}
                {detailPlan.policyDocUrl && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Policy document
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setDetailPlan(null)}
                >
                  Close
                </Button>
                {!detailPlan.enrolled &&
                  detailPlan.enrollStatus === "not_enrolled" && (
                    <Button
                      size="sm"
                      className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white gap-1.5"
                      onClick={() => {
                        setDetailPlan(null);
                        setEnrollPlan(detailPlan);
                      }}
                    >
                      <ChevronRight className="w-3.5 h-3.5" /> Request
                      Enrollment
                    </Button>
                  )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Enrollment Request Modal ── */}
      <Dialog open={!!enrollPlan} onOpenChange={() => setEnrollPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#7F77DD]/10">
                <BadgeCheck className="w-4 h-4 text-[#7F77DD]" />
              </div>
              <DialogTitle className="text-sm font-semibold">
                Request Enrollment
              </DialogTitle>
            </div>
            {enrollPlan && (
              <p className="text-xs text-muted-foreground mt-1">
                {enrollPlan.name}
              </p>
            )}
          </DialogHeader>
          {enrollDone ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium text-[#1D9E75]">
                ✓ Enrollment request submitted
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                HR will review and notify you of the decision.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              {enrollPlan && (
                <div className="rounded-lg bg-muted/40 border border-border p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Your monthly contribution
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {formatCurrency(enrollPlan.employeeContribution)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Company contribution
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {formatCurrency(enrollPlan.companyContribution)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">
                  Additional notes{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </p>
                <Textarea
                  value={enrollNote}
                  onChange={(e) => setEnrollNote(e.target.value)}
                  placeholder="Any information HR should know about this enrollment request…"
                  className="text-xs min-h-20 resize-none"
                />
              </div>
              <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Your request will be sent to HR for approval. You will be
                  notified once a decision is made.
                </span>
              </div>
            </div>
          )}
          {!enrollDone && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setEnrollPlan(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
                onClick={handleEnrollSubmit}
              >
                Submit Request
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Life Event Modal ── */}
      <Dialog open={lifeEventOpen} onOpenChange={setLifeEventOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#7F77DD]/10">
                <Send className="w-4 h-4 text-[#7F77DD]" />
              </div>
              <DialogTitle className="text-sm font-semibold">
                Submit a Life Event
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Life events may affect your benefit eligibility. HR will review
              and update your coverage accordingly.
            </p>
          </DialogHeader>
          {leDone ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium text-[#1D9E75]">
                ✓ Life event submitted
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                HR will review your coverage and contact you if any changes
                apply.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Event type</p>
                <Select value={leType} onValueChange={setLeType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIFE_EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Event date</p>
                <Input
                  type="date"
                  value={leDate}
                  onChange={(e) => setLeDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </p>
                <Textarea
                  value={leDesc}
                  onChange={(e) => setLeDesc(e.target.value)}
                  placeholder="Provide any relevant details about this life event…"
                  className="text-xs min-h-20 resize-none"
                />
              </div>
            </div>
          )}
          {!leDone && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setLifeEventOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
                onClick={handleLifeEventSubmit}
                disabled={!leType}
              >
                Submit
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add Dependent Modal ── */}
      <Dialog open={addDepOpen} onOpenChange={setAddDepOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#7F77DD]/10">
                <Users className="w-4 h-4 text-[#7F77DD]" />
              </div>
              <DialogTitle className="text-sm font-semibold">
                Add Dependent
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">Full name</p>
              <Input
                value={depName}
                onChange={(e) => setDepName(e.target.value)}
                placeholder="Dependent's full name"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">Relationship</p>
              <Select value={depRel} onValueChange={setDepRel}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">
                Date of birth{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </p>
              <Input
                type="date"
                value={depDob}
                onChange={(e) => setDepDob(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => setAddDepOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
              onClick={handleAddDependent}
              disabled={!depName || !depRel}
            >
              Add Dependent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Benefit Card ─────────────────────────────────────────────────────────────

function BenefitCard({
  plan,
  onView,
  onEnroll,
}: {
  plan: BenefitPlan;
  onView: (p: BenefitPlan) => void;
  onEnroll?: (p: BenefitPlan) => void;
}) {
  const cfg = TYPE_CONFIG[plan.type];
  const Icon = cfg.icon;
  const open = isOpenEnrollment(plan);

  return (
    <Card className="flex flex-col hover:shadow-sm transition-shadow">
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${cfg.bg}18` }}
            >
              <Icon className="w-4 h-4" style={{ color: cfg.text }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">
                {plan.name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {plan.provider}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full border font-bold shrink-0 whitespace-nowrap",
              ENROLL_STYLES[plan.enrollStatus],
            )}
          >
            {ENROLL_LABELS[plan.enrollStatus]}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground line-clamp-2 flex-1">
          {plan.description}
        </p>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground">
              Your contribution
            </p>
            <p className="text-xs font-bold text-foreground">
              {plan.employeeContribution === 0
                ? "Free"
                : `${formatCurrency(plan.employeeContribution)}/mo`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Company pays</p>
            <p className="text-xs font-bold text-[#1D9E75]">
              {formatCurrency(plan.companyContribution)}/mo
            </p>
          </div>
        </div>

        {plan.allowDependents && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>
              {plan.dependents.length > 0
                ? `${plan.dependents.length} dependent${plan.dependents.length > 1 ? "s" : ""} added`
                : "Dependents allowed"}
            </span>
          </div>
        )}
      </CardContent>

      <CardHeader className="pt-0 px-4 pb-4 flex flex-row items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs gap-1"
          onClick={() => onView(plan)}
        >
          <Eye className="w-3.5 h-3.5" /> View Details
        </Button>
        {!plan.enrolled &&
          plan.enrollStatus === "not_enrolled" &&
          open &&
          onEnroll && (
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-[#7F77DD] hover:bg-[#6c64cc] text-white gap-1"
              onClick={() => onEnroll(plan)}
            >
              <Plus className="w-3.5 h-3.5" /> Enroll
            </Button>
          )}
        {!plan.enrolled && plan.enrollStatus === "not_enrolled" && !open && (
          <div className="flex-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <AlertCircle className="w-3 h-3" /> Enrollment closed
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
