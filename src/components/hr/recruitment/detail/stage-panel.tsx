"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Mail,
  MoreHorizontal,
  Eye,
  ArrowRight,
  Filter,
  ListChecks,
  UserCheck,
  CalendarPlus,
  X,
  FileSignature,
  ThumbsUp,
  ThumbsDown,
  ClipboardCheck,
  AlertTriangle,
  CalendarDays,
  Download,
  Monitor,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  moveStage,
  setCandidateStatus,
  updateCandidate,
  scheduleInterview,
  recordInterviewScores,
  sendOffer,
  respondToOffer,
  uid,
} from "@/src/lib/stores/recruitment-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import {
  offerAccepted,
  offerDeclined,
  offerSent,
} from "@/src/lib/notifications/recruitment";
import { useCan } from "@/src/lib/permissions/use-can";
import {
  REJECTION_REASONS,
  SOURCE_LABELS,
  STAGE_TYPE_LABELS,
} from "@/src/data/recruitment-demo";
import {
  renderTemplate,
  templatesForStage,
  type EmailTemplate,
} from "@/src/data/recruitment-templates";
import type {
  Candidate,
  Interview,
  InterviewMode,
  JobRequisition,
  RecruitmentStageType,
  ScorecardRecommendation,
} from "@/src/lib/types/recruitment";
import { latestOffer, stageShowsScore } from "@/src/lib/types/recruitment";
import { getFlow, nextEnabledStage, matchesConstraint } from "../flow";
import { canMoveTo, daysInStage } from "./advance";
import {
  findConflicts,
  interviewWhen,
  relevantInterview,
} from "./interview-conflicts";
import {
  googleCalUrl,
  icsDataUrl,
  outlookCalUrl,
  interviewTitle,
} from "../components/calendar-links";
import { useOnboardingInvite } from "../use-invite";
import { CandidateDrawer } from "../components/candidate-drawer";
import { openMailto } from "../components/mailto";

const ORANGE_TAB =
  "data-[state=active]:bg-[#ff8b2d]! data-[state=active]:text-white! data-[state=active]:shadow-none!";

const MODE_ICON: Record<InterviewMode, typeof Monitor> = {
  video: Monitor,
  phone: Phone,
  onsite: MapPin,
};

interface StagePanelProps {
  country: string;
  requisition: JobRequisition;
  stage: RecruitmentStageType;
  candidates: Candidate[];
  interviews: Interview[];
  /** Candidate id to open the drawer on, from the `?candidate=` deep link. */
  focusCandidateId?: string | null;
  onFocusCandidate?: (id: string | null) => void;
}

/**
 * The state of whatever this stage is waiting on.
 *
 * Each tab is waiting on a different thing — the interview to happen, the
 * scorecard to be written, the candidate to answer their offer, the new hire to
 * be invited to onboarding — so the column reports a different fact on each.
 * `STATUS_COLUMN_HEADER` names which fact, because a column headed just
 * "Status" leaves the reader asking "status of what?".
 */
type StatusTone =
  | "new"
  | "scheduled"
  | "awaiting_interview"
  | "completed"
  | "unscored"
  | "invited"
  | "not_invited"
  | "pending"
  | "rejected"
  // §7.18 — where an offer has got to, which "pending" couldn't express.
  | "offer_sent"
  | "offer_accepted"
  | "offer_declined";

/**
 * What the status column is reporting on, per stage.
 *
 * Each keeps the word "status" so the column still reads as a state rather than
 * as a value — "Interview" alone would look like a date or a round name.
 */
const STATUS_COLUMN_HEADER: Record<RecruitmentStageType, string> = {
  applicants: "Application status",
  interview: "Interview status",
  interviewed: "Scorecard status",
  offer: "Offer status",
  hired: "Onboarding status",
};

const STATUS_STYLES: Record<StatusTone, string> = {
  new: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  awaiting_interview:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  unscored: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  invited: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  not_invited:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  offer_sent:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  offer_accepted:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  offer_declined: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
};

/**
 * Labels say what has or hasn't happened, not how far along something vaguely
 * is. "Not scored yet" tells you what to do next; "Pending" does not.
 */
const STATUS_LABELS: Record<StatusTone, string> = {
  new: "New application",
  scheduled: "Interview booked",
  awaiting_interview: "Not booked yet",
  completed: "Scored",
  unscored: "Not scored yet",
  invited: "Onboarding invite sent",
  not_invited: "Invite not sent",
  pending: "Pending",
  rejected: "Rejected",
  offer_sent: "Awaiting response",
  offer_accepted: "Offer accepted",
  offer_declined: "Offer declined",
};

export function StagePanel({
  country,
  requisition,
  stage,
  candidates,
  interviews,
  focusCandidateId,
  onFocusCandidate,
}: StagePanelProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const companyName = useAppSelector((s) => s.locale.data?.tenant?.name);
  const canEdit = useCan("talent.recruitment", "edit");
  const canDelete = useCan("talent.recruitment", "delete");
  const invite = useOnboardingInvite(country);

  const flow = getFlow(requisition);
  const form = useMemo(
    () => requisition.applicationForm ?? [],
    [requisition.applicationForm],
  );
  const constraints = useMemo(
    () => requisition.filterConstraints ?? [],
    [requisition.filterConstraints],
  );
  const nextStage = nextEnabledStage(flow, stage);
  const nextLabel = nextStage ? STAGE_TYPE_LABELS[nextStage] : null;

  const [showRejected, setShowRejected] = useState(false);
  const [filterId, setFilterId] = useState<string>("");
  /** Ids checked in the table — bulk actions run on these when non-empty. */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Confirmation dialog (advance-to-hired, reject all, etc.).
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  const active = useMemo(
    () => candidates.find((c) => c.id === focusCandidateId) ?? null,
    [candidates, focusCandidateId],
  );
  const openCandidate = useCallback(
    (c: Candidate | null) => onFocusCandidate?.(c?.id ?? null),
    [onFocusCandidate],
  );

  // Interview status by candidate id (for the Status column).
  const interviewStatusByCandidate = useMemo(() => {
    const m = new Map<string, "scheduled" | "completed">();
    for (const iv of interviews) {
      if (iv.status === "cancelled") continue;
      const cur = m.get(iv.candidateId);
      if (iv.status === "completed") m.set(iv.candidateId, "completed");
      else if (!cur) m.set(iv.candidateId, "scheduled");
    }
    return m;
  }, [interviews]);

  /**
   * The interview shown on each row, plus any panel double-bookings.
   *
   * These used to be a separate agenda below the table. Split across two
   * surfaces you had to match names by eye to find out when someone was booked
   * in, so the session now sits on the candidate's own row.
   */
  const interviewByCandidate = useMemo(() => {
    const m = new Map<string, Interview>();
    for (const c of candidates) {
      const iv = relevantInterview(interviews, c.id);
      if (iv) m.set(c.id, iv);
    }
    return m;
  }, [candidates, interviews]);

  const conflicts = useMemo(() => findConflicts(interviews), [interviews]);

  /** Only the interview stages have an interview worth a column. */
  const showsInterview = stage === "interview" || stage === "interviewed";

  const rows = useMemo(() => {
    const inStage = candidates.filter((c) => c.stage === stage);
    const visible = showRejected
      ? inStage
      : inStage.filter((c) => c.status !== "rejected");
    const fc = constraints.find((x) => x.id === filterId);
    return fc ? visible.filter((c) => matchesConstraint(c, fc, form)) : visible;
  }, [candidates, stage, showRejected, constraints, filterId, form]);

  const activeInStage = useMemo(
    () => candidates.filter((c) => c.stage === stage && c.status === "active"),
    [candidates, stage],
  );

  /** Clashes affecting the people visible on this tab, not the whole pipeline. */
  const visibleConflicts = useMemo(() => {
    const names = new Set<string>();
    for (const c of rows) {
      const iv = interviewByCandidate.get(c.id);
      for (const n of (iv && conflicts.get(iv.id)) ?? []) names.add(n);
    }
    return [...names];
  }, [rows, interviewByCandidate, conflicts]);

  /**
   * Who a bulk action applies to: the checked rows, or — when nothing is
   * checked — everyone active in the tab. The old code always did the latter
   * silently, so ticking three boxes and emailing hit all forty.
   */
  const bulkTargets = useMemo(() => {
    if (selectedIds.length === 0) return activeInStage;
    const chosen = new Set(selectedIds);
    return rows.filter((c) => chosen.has(c.id) && c.status === "active");
  }, [selectedIds, activeInStage, rows]);
  const bulkScope =
    selectedIds.length > 0
      ? `${bulkTargets.length} selected`
      : `all ${activeInStage.length} in this tab`;

  const statusTone = useCallback(
    (c: Candidate): StatusTone => {
      if (c.status === "rejected") return "rejected";
      if (stage === "interview") {
        return interviewStatusByCandidate.get(c.id) ?? "awaiting_interview";
      }
      // On the Interviewed tab the interesting fact is whether the interview
      // has actually been rated, not that it happened.
      if (stage === "interviewed") {
        return c.score != null ? "completed" : "unscored";
      }
      // §7.18 — on the offer tab, "pending" and "offer sent" are very different
      // things to a recruiter chasing responses.
      if (stage === "offer") {
        const offer = latestOffer(c);
        if (!offer) return "pending";
        if (offer.status === "accepted") return "offer_accepted";
        if (offer.status === "rejected") return "offer_declined";
        return "offer_sent";
      }
      if (stage === "hired") {
        return c.onboardingInvitedAt ? "invited" : "not_invited";
      }
      return "new";
    },
    [stage, interviewStatusByCandidate],
  );

  // ── Rejection (with a reason) ──
  const [rejectFor, setRejectFor] = useState<Candidate[] | null>(null);
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);

  function openReject(targets: Candidate[]) {
    if (targets.length === 0) {
      toast.error("Nobody to reject.");
      return;
    }
    setRejectFor(targets);
    setRejectReason(REJECTION_REASONS[0]);
  }

  function confirmReject() {
    if (!rejectFor) return;
    const ids = rejectFor.map((c) => c.id);
    const at = new Date().toISOString().slice(0, 10);
    dispatch(setCandidateStatus({ country, ids, status: "rejected" }));
    for (const c of rejectFor) {
      dispatch(
        updateCandidate({
          country,
          id: c.id,
          patch: { rejectionReason: rejectReason, rejectedAt: at },
        }),
      );
    }
    toast.success(
      ids.length === 1
        ? `${rejectFor[0].name} rejected`
        : `${ids.length} candidates rejected`,
    );
    setRejectFor(null);
  }

  function restore(c: Candidate) {
    dispatch(setCandidateStatus({ country, ids: [c.id], status: "active" }));
    dispatch(
      updateCandidate({
        country,
        id: c.id,
        patch: { rejectionReason: undefined, rejectedAt: undefined },
      }),
    );
    toast.success(`${c.name} restored`);
  }


  // ── Email (templated) ──
  const [emailFor, setEmailFor] = useState<Candidate[] | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const stageTemplates = useMemo(() => templatesForStage(stage), [stage]);

  const templateVars = useCallback(
    (targets: Candidate[]) => ({
      candidate: targets.length === 1 ? targets[0].name : "there",
      role: requisition.positionTitle,
      company: companyName ?? "our team",
      date: requisition.targetStartDate,
      salary: requisition.salaryMax ? String(requisition.salaryMax) : "",
    }),
    [requisition, companyName],
  );

  function openEmail(targets: Candidate[], template?: EmailTemplate) {
    if (targets.length === 0) {
      toast.error("No candidates to email.");
      return;
    }
    const tpl = template ?? stageTemplates[0];
    const vars = templateVars(targets);
    setEmailFor(targets);
    setEmailSubject(renderTemplate(tpl.subject, vars));
    setEmailBody(renderTemplate(tpl.body, vars));
  }

  function applyTemplate(id: string) {
    const tpl = stageTemplates.find((t) => t.id === id);
    if (!tpl || !emailFor) return;
    const vars = templateVars(emailFor);
    setEmailSubject(renderTemplate(tpl.subject, vars));
    setEmailBody(renderTemplate(tpl.body, vars));
  }

  function sendEmail() {
    if (!emailFor) return;
    const addresses = emailFor.map((c) => c.email).filter(Boolean);
    openMailto(
      emailFor.length === 1
        ? { to: addresses, subject: emailSubject, body: emailBody }
        : { bcc: addresses, subject: emailSubject, body: emailBody },
    );
    setEmailFor(null);
  }

  // ── Onboarding invites (hired) ──
  function inviteOne(c: Candidate) {
    invite(c, requisition);
    openEmail(
      [c],
      stageTemplates.find((t) => t.id === "tpl-onboarding-invite"),
    );
  }
  function inviteBulk() {
    const targets = bulkTargets;
    if (targets.length === 0) {
      toast.error("No hires to invite.");
      return;
    }
    let sent = 0;
    for (const c of targets) if (invite(c, requisition)) sent++;
    toast.success(
      sent === 0
        ? "Everyone selected has already been invited."
        : `${sent} onboarding invite(s) created`,
    );
    openEmail(
      targets,
      stageTemplates.find((t) => t.id === "tpl-onboarding-invite"),
    );
  }

  // ── Advance modal (applicant → interview, with scheduling) ──
  const [advanceFor, setAdvanceFor] = useState<Candidate[] | null>(null);
  const [round, setRound] = useState("Interview 1");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMins, setDurationMins] = useState(45);
  const [mode, setMode] = useState<InterviewMode>("video");
  const [location, setLocation] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");

  function openAdvance(recipients: Candidate[]) {
    if (recipients.length === 0) {
      toast.error("No applicants to advance.");
      return;
    }
    // Refuse the whole batch rather than half-advancing it.
    const blocked = nextStage
      ? recipients
          .map((c) => ({ c, v: canMoveTo(c, nextStage, flow) }))
          .filter((x) => !x.v.ok)
      : [];
    if (blocked.length > 0) {
      toast.error(blocked[0].v.reason ?? "Can't advance this applicant.");
      return;
    }
    const vars = templateVars(recipients);
    const tpl = stageTemplates.find((t) => t.id === "tpl-interview-invite");
    setAdvanceFor(recipients);
    setRound("Interview 1");
    setScheduledAt("");
    setDurationMins(45);
    setMode("video");
    setLocation("");
    setMailSubject(
      tpl
        ? renderTemplate(tpl.subject, vars)
        : `Interview invitation — ${requisition.positionTitle}`,
    );
    setMailBody(
      tpl
        ? renderTemplate(tpl.body, vars)
        : "We'd like to invite you to an interview. Details to follow — please confirm your availability.",
    );
  }

  function confirmAdvance() {
    if (!advanceFor || !nextStage) return;
    if (!scheduledAt) {
      toast.error("Pick an interview date & time.");
      return;
    }
    const ids = advanceFor.map((c) => c.id);
    dispatch(moveStage({ country, ids, stage: nextStage }));
    for (const c of advanceFor) {
      dispatch(
        scheduleInterview({
          country,
          interview: {
            id: uid("IV"),
            candidateId: c.id,
            candidateName: c.name,
            requisitionId: c.requisitionId,
            round,
            scheduledAt,
            durationMins,
            mode,
            panel: [],
            panelNames: [],
            location: location || undefined,
            status: "scheduled",
          },
        }),
      );
    }
    toast.success(
      advanceFor.length === 1
        ? `${advanceFor[0].name} scheduled for interview`
        : `${advanceFor.length} applicants scheduled for interview`,
    );
    setAdvanceFor(null);
  }

  /**
   * ── Interview scoring — the gate out of "Scheduled for Interview" ──
   *
   * Scoring is not an edit you can make at any time; it is how a candidate
   * leaves this stage. That is why the modal is opened by the advance action
   * rather than sitting behind a separate "score" button, and why there is no
   * Score column on this tab: there is nothing to show until the interview has
   * happened, and offering one invites a rating for a meeting nobody attended.
   */
  const [scoreFor, setScoreFor] = useState<Candidate[] | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [scoreNotes, setScoreNotes] = useState<Record<string, string>>({});
  const [scoreRecs, setScoreRecs] = useState<
    Record<string, ScorecardRecommendation>
  >({});

  function openScoring(targets: Candidate[]) {
    const eligible = targets.filter((c) => c.status === "active");
    if (eligible.length === 0) {
      toast.error("No interview candidates to score.");
      return;
    }
    // Seeded per candidate: one score applied to everybody was the old
    // behaviour and made the resulting scorecards meaningless.
    setScores(Object.fromEntries(eligible.map((c) => [c.id, c.score ?? 3])));
    setScoreNotes(Object.fromEntries(eligible.map((c) => [c.id, ""])));
    setScoreRecs(
      Object.fromEntries(
        eligible.map((c) => [c.id, "yes" as ScorecardRecommendation]),
      ),
    );
    setScoreFor(eligible);
  }

  function applyScores() {
    if (!scoreFor) return;
    const missing = scoreFor.filter((c) => !scoreNotes[c.id]?.trim());
    if (missing.length > 0) {
      toast.error("Add interview notes before recording the score.", {
        description:
          missing.length === 1
            ? missing[0].name
            : `${missing.length} candidates still need notes.`,
      });
      return;
    }
    // Scoring and advancing are one dispatch — see `recordInterviewScores`.
    dispatch(
      recordInterviewScores({
        country,
        entries: scoreFor.map((c) => ({
          candidateId: c.id,
          score: scores[c.id] ?? 3,
          comment: scoreNotes[c.id],
          recommendation: scoreRecs[c.id],
        })),
        by: user?.name ?? "Recruiter",
        advanceTo: "interviewed",
      }),
    );
    toast.success(
      scoreFor.length === 1
        ? `${scoreFor[0].name} scored and moved to Interviewed`
        : `${scoreFor.length} candidates scored and moved to Interviewed`,
    );
    setScoreFor(null);
  }

  // ── Advance a single candidate → next stage ──
  function advanceOne(c: Candidate) {
    if (!nextStage) return;
    // Leaving "scheduled for interview" means recording the interview, so the
    // advance action *is* the scoring form rather than a step before it.
    if (nextStage === "interviewed") {
      openScoring([c]);
      return;
    }
    const verdict = canMoveTo(c, nextStage, flow);
    if (!verdict.ok) {
      toast.error(verdict.reason ?? "Can't advance this candidate.", {
        description:
          nextStage === "hired"
            ? "Send an offer and record their acceptance first."
            : undefined,
      });
      return;
    }
    dispatch(moveStage({ country, ids: [c.id], stage: nextStage }));
    toast.success(`${c.name} moved to ${nextLabel}`);
    // Reaching the offer stage is the moment the offer gets drafted, so open
    // the form rather than making the recruiter find it on the next tab.
    if (nextStage === "offer") openOffer(c);
  }

  // ── §7.18 Offers ──
  const [offerFor, setOfferFor] = useState<Candidate | null>(null);
  const [offerSalary, setOfferSalary] = useState("");
  const [offerStartDate, setOfferStartDate] = useState("");
  const [offerNotes, setOfferNotes] = useState("");

  function openOffer(c: Candidate) {
    setOfferFor(c);
    // Seed from the requisition so the recruiter isn't retyping the band.
    setOfferSalary(requisition.salaryMax ? String(requisition.salaryMax) : "");
    setOfferStartDate(requisition.targetStartDate ?? "");
    setOfferNotes("");
  }

  function confirmOffer() {
    if (!offerFor) return;
    const salary = Number(offerSalary.replace(/,/g, ""));
    const amount = Number.isFinite(salary) && salary > 0 ? salary : undefined;
    dispatch(
      sendOffer({
        country,
        candidateId: offerFor.id,
        salary: amount,
        startDate: offerStartDate || undefined,
        notes: offerNotes.trim() || undefined,
      }),
    );
    const tpl = stageTemplates.find((t) => t.id === "tpl-offer");
    const vars = {
      ...templateVars([offerFor]),
      date: offerStartDate || requisition.targetStartDate,
      salary: amount ? amount.toLocaleString() : "",
    };
    openMailto({
      to: [offerFor.email],
      subject: tpl
        ? renderTemplate(tpl.subject, vars)
        : `Offer — ${requisition.positionTitle}`,
      body: tpl ? renderTemplate(tpl.body, vars) : "",
    });
    dispatch(
      pushNotification(
        offerSent(
          offerFor.name,
          requisition.positionTitle,
          amount,
          offerStartDate || undefined,
        ),
      ),
    );
    toast.success(`Offer sent to ${offerFor.name}`);
    setOfferFor(null);
  }

  // ── Recording what the candidate said about their offer ──
  const [responseFor, setResponseFor] = useState<{
    candidate: Candidate;
    accepted: boolean;
  } | null>(null);
  const [responseNote, setResponseNote] = useState("");

  function openOfferResponse(c: Candidate, accepted: boolean) {
    setResponseFor({ candidate: c, accepted });
    setResponseNote("");
  }

  /**
   * Record the candidate's answer, and move accepted hires forward.
   *
   * An acceptance is what unlocks `hired` — the gate in `canMoveTo` reads the
   * offer, so recording the answer and moving them is deliberately one step:
   * leaving an accepted candidate sitting on the Offer tab is how someone ends
   * up chasing a response that already came back.
   */
  function confirmOfferResponse() {
    if (!responseFor) return;
    const { candidate: c, accepted } = responseFor;
    dispatch(
      respondToOffer({
        country,
        candidateId: c.id,
        accepted,
        by: user?.name ?? "Recruiter",
        note: responseNote,
      }),
    );
    if (accepted) {
      const hiredStage = nextEnabledStage(flow, "offer") ?? "hired";
      dispatch(moveStage({ country, ids: [c.id], stage: hiredStage }));
      dispatch(
        pushNotification(offerAccepted(c.name, requisition.positionTitle)),
      );
      toast.success(
        `${c.name} accepted — moved to ${STAGE_TYPE_LABELS[hiredStage]}`,
      );
    } else {
      dispatch(
        pushNotification(offerDeclined(c.name, requisition.positionTitle)),
      );
      toast.info(`${c.name} declined the offer`, {
        description: "They've been closed out of this pipeline.",
      });
    }
    setResponseFor(null);
  }

  /**
   * Row actions, read through a ref.
   *
   * These handlers are redefined every render, so listing them as deps would
   * rebuild the column defs every render and defeat the memo — which is what
   * the disabled exhaustive-deps suppression here used to paper over. Reading
   * them through a ref that is refreshed on each render keeps the memo honest
   * *and* keeps the handlers current, so the offer menu can't go stale.
   */
  const handlers = useRef({
    openAdvance,
    advanceOne,
    openOffer,
    openOfferResponse,
    inviteOne,
    openEmail,
    openReject,
    restore,
  });
  // Refreshed after commit rather than during render — a menu item can only
  // fire once the row is on screen, by which point this has caught up.
  useEffect(() => {
    handlers.current = {
      openAdvance,
      advanceOne,
      openOffer,
      openOfferResponse,
      inviteOne,
      openEmail,
      openReject,
      restore,
    };
  });

  const columns = useMemo<ColumnDef<Candidate>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: sortableHeader("Applicant"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {row.original.initials}
            </div>
            <div>
              <div className="font-medium text-foreground">
                {row.original.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {row.original.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "source",
        header: sortableHeader("Source"),
        accessorFn: (c) => SOURCE_LABELS[c.source] ?? c.source,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {SOURCE_LABELS[row.original.source] ?? row.original.source}
          </span>
        ),
      },
      {
        accessorKey: "appliedAt",
        header: sortableHeader("Applied"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.appliedAt || "—"}
          </span>
        ),
      },
      // The interview itself, on the row of the person being interviewed.
      ...(showsInterview
        ? [
            {
              id: "interview",
              header: sortableHeader("Interview"),
              accessorFn: (c: Candidate) =>
                interviewByCandidate.get(c.id)?.scheduledAt ?? "",
              cell: ({ row }: { row: { original: Candidate } }) => {
                const iv = interviewByCandidate.get(row.original.id);
                if (!iv) {
                  return (
                    <span className="text-xs text-muted-foreground">
                      Not scheduled
                    </span>
                  );
                }
                const ModeIcon = MODE_ICON[iv.mode];
                const clash = conflicts.get(iv.id);
                return (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground tabular-nums">
                      {interviewWhen(iv.scheduledAt)}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                      <span>{iv.round}</span>
                      <span className="inline-flex items-center gap-1 capitalize">
                        <ModeIcon className="h-3 w-3" /> {iv.mode}
                      </span>
                      <span>· {iv.durationMins}m</span>
                      {iv.panelNames.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {iv.panelNames.join(", ")}
                        </span>
                      )}
                    </span>
                    {clash && (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {[...new Set(clash)].join(", ")} double-booked
                      </span>
                    )}
                  </div>
                );
              },
            } as ColumnDef<Candidate>,
          ]
        : []),
      {
        id: "ageInStage",
        header: sortableHeader("In stage"),
        accessorFn: (c) => daysInStage(c),
        cell: ({ row }) => {
          const days = daysInStage(row.original);
          return (
            <span
              className={
                days > 14
                  ? "text-sm text-amber-600 dark:text-amber-400"
                  : "text-sm text-muted-foreground"
              }
            >
              {days}d
            </span>
          );
        },
      },
      {
        id: "status",
        header: STATUS_COLUMN_HEADER[stage],
        cell: ({ row }) => {
          const tone = statusTone(row.original);
          return (
            <div className="flex flex-col gap-0.5">
              <Badge variant="outline" className={`w-fit text-[10px] ${STATUS_STYLES[tone]}`}>
                {STATUS_LABELS[tone]}
              </Badge>
              {row.original.rejectionReason && (
                <span className="text-[10px] text-muted-foreground">
                  {row.original.rejectionReason}
                </span>
              )}
            </div>
          );
        },
      },
      // Only from Interviewed onwards. Before the interview has happened there
      // is nothing to score, and a column full of dashes reads as missing data
      // rather than as "not yet applicable".
      ...(stageShowsScore(stage)
        ? [
            {
              accessorKey: "score",
              header: sortableHeader("Score"),
              cell: ({ row }: { row: { original: Candidate } }) =>
                row.original.score != null ? (
                  <span className="text-sm font-medium text-foreground">
                    {row.original.score.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                ),
            } as ColumnDef<Candidate>,
          ]
        : []),
      actionsColumn<Candidate>((c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2" onClick={() => openCandidate(c)}>
              <Eye className="w-3.5 h-3.5" /> View detail
            </DropdownMenuItem>

            {canEdit && stage === "applicants" && nextStage && c.status === "active" && (
              <DropdownMenuItem
                className="gap-2"
                onClick={() => handlers.current.openAdvance([c])}
              >
                <ArrowRight className="w-3.5 h-3.5" /> Advance applicant
              </DropdownMenuItem>
            )}
            {/* Leaving the interview stage means recording a score, so this
                opens the scoring form rather than a bare confirmation. */}
            {canEdit && stage === "interview" && c.status === "active" && (
              <DropdownMenuItem
                className="gap-2"
                onClick={() => handlers.current.advanceOne(c)}
              >
                <ClipboardCheck className="w-3.5 h-3.5" /> Score &amp; advance
              </DropdownMenuItem>
            )}
            {canEdit &&
              stage === "interviewed" &&
              nextStage &&
              c.status === "active" && (
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() =>
                    setConfirm({
                      title: `Advance ${c.name}?`,
                      description: `This moves ${c.name} to ${nextLabel}.`,
                      action: () => handlers.current.advanceOne(c),
                    })
                  }
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Advance applicant
                </DropdownMenuItem>
              )}
            {/* §7.18 — send the offer, then record what they said. */}
            {canEdit && stage === "offer" && c.status === "active" && (
              <>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => handlers.current.openOffer(c)}
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  {latestOffer(c) ? "Resend offer" : "Send offer"}
                </DropdownMenuItem>
                {latestOffer(c)?.status === "sent" && (
                  <>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() =>
                        handlers.current.openOfferResponse(c, true)
                      }
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Record acceptance
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() =>
                        handlers.current.openOfferResponse(c, false)
                      }
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Record decline
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
            {canEdit && stage === "hired" && c.status === "active" && (
              <DropdownMenuItem
                className="gap-2"
                onClick={() => handlers.current.inviteOne(c)}
              >
                <UserCheck className="w-3.5 h-3.5" />
                {c.onboardingInvitedAt ? "Resend invite" : "Send onboarding invite"}
              </DropdownMenuItem>
            )}
            {/* Calendar links for the booked session — these lived on the
                agenda cards before the schedule moved into the table. */}
            {(() => {
              const iv = interviewByCandidate.get(c.id);
              if (!iv || iv.status !== "scheduled") return null;
              return (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">
                    Add interview to calendar
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild className="gap-2">
                    <a
                      href={googleCalUrl(iv)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <CalendarDays className="w-3.5 h-3.5" /> Google Calendar
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-2">
                    <a
                      href={outlookCalUrl(iv)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <CalendarDays className="w-3.5 h-3.5" /> Outlook
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-2">
                    <a
                      href={icsDataUrl(iv)}
                      download={`${interviewTitle(iv)}.ics`}
                    >
                      <Download className="w-3.5 h-3.5" /> Download .ics
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              );
            })()}

            <DropdownMenuItem
              className="gap-2"
              onClick={() => handlers.current.openEmail([c])}
            >
              <Mail className="w-3.5 h-3.5" /> Send email
            </DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="gap-2"
                  onClick={() =>
                    c.status === "rejected"
                      ? handlers.current.restore(c)
                      : handlers.current.openReject([c])
                  }
                >
                  <X className="w-3.5 h-3.5" />
                  {c.status === "rejected" ? "Restore" : "Reject"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ];
  }, [
    stage,
    nextStage,
    nextLabel,
    statusTone,
    canEdit,
    canDelete,
    openCandidate,
    showsInterview,
    interviewByCandidate,
    conflicts,
  ]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch
            checked={showRejected}
            onCheckedChange={(v) => setShowRejected(Boolean(v))}
          />
          Show rejected
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Filter dropdown */}
          <Select
            value={filterId || "all"}
            onValueChange={(v) => setFilterId(v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-9 gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All applicants</SelectItem>
              {constraints.map((fc) => (
                <SelectItem key={fc.id} value={fc.id}>
                  {fc.name || "(untitled)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bulk action dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <ListChecks className="w-4 h-4" />
                Bulk action
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* Say out loud who this is about to hit. */}
              <DropdownMenuLabel className="text-xs">
                Applies to {bulkScope}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {canEdit && stage === "applicants" && nextStage && (
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => openAdvance(bulkTargets)}
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Advance → {nextLabel}
                </DropdownMenuItem>
              )}
              {canEdit && stage === "interview" && (
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => openScoring(bulkTargets)}
                >
                  <ListChecks className="w-3.5 h-3.5" /> Score &amp; advance
                </DropdownMenuItem>
              )}
              {canEdit && stage === "hired" && (
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() =>
                    setConfirm({
                      title: "Send onboarding invites?",
                      description: `This starts onboarding for ${bulkScope} and opens your mail client.`,
                      action: inviteBulk,
                    })
                  }
                >
                  <UserCheck className="w-3.5 h-3.5" /> Send onboarding invites
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className="gap-2"
                onClick={() => openEmail(bulkTargets)}
              >
                <Mail className="w-3.5 h-3.5" /> Send email
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="gap-2"
                    onClick={() => openReject(bulkTargets)}
                  >
                    <X className="w-3.5 h-3.5" /> Reject {bulkScope}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* A panellist booked in two places at once only ever surfaces when
          somebody fails to turn up, so it is called out above the rows. */}
      {showsInterview && visibleConflicts.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {visibleConflicts.join(", ")}{" "}
            {visibleConflicts.length === 1 ? "is" : "are"} booked into two
            interviews at once.
          </span>
        </div>
      )}

      <DataTable
        exportTitle="Candidates"
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        enableSelection
        onSelectionChange={setSelectedIds}
        onRowClick={(c) => openCandidate(c)}
        searchPlaceholder="Search applicants…"
        emptyMessage="No applicants in this stage."
      />

      {active && (
        <CandidateDrawer
          country={country}
          candidate={active}
          requisition={requisition}
          interviews={interviews}
          onClose={() => openCandidate(null)}
        />
      )}

      {/* Advance modal — schedule interview + email (applicant tab) */}
      <Dialog
        open={Boolean(advanceFor)}
        onOpenChange={(v) => !v && setAdvanceFor(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {advanceFor && advanceFor.length === 1
                ? `Advance ${advanceFor[0].name}`
                : `Advance ${advanceFor?.length ?? 0} applicants`}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="schedule" className="py-1">
            <TabsList className="h-9">
              <TabsTrigger value="schedule" className={`text-sm px-3 ${ORANGE_TAB}`}>
                Schedule interview
              </TabsTrigger>
              <TabsTrigger value="email" className={`text-sm px-3 ${ORANGE_TAB}`}>
                Email applicant{advanceFor && advanceFor.length > 1 ? "s" : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Round</Label>
                  <Input value={round} onChange={(e) => setRound(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Date &amp; time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration (mins)</Label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={durationMins}
                    onChange={(e) =>
                      setDurationMins(Math.max(15, Number(e.target.value) || 45))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Mode</Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as InterviewMode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="onsite">Onsite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Location / link</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="mt-3">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input
                    value={mailSubject}
                    onChange={(e) => setMailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea
                    rows={5}
                    value={mailBody}
                    onChange={(e) => setMailBody(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() =>
                    openMailto({
                      bcc: (advanceFor ?? []).map((c) => c.email).filter(Boolean),
                      subject: mailSubject,
                      body: mailBody,
                    })
                  }
                >
                  <Mail className="w-4 h-4" /> Open in mail client
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvanceFor(null)}>
              Cancel
            </Button>
            <Button className="gap-1.5" onClick={confirmAdvance}>
              <CalendarPlus className="w-4 h-4" />
              Schedule &amp; advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* §7.20 — templated candidate email */}
      <Dialog open={Boolean(emailFor)} onOpenChange={(v) => !v && setEmailFor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {emailFor && emailFor.length === 1
                ? `Email ${emailFor[0].name}`
                : `Email ${emailFor?.length ?? 0} candidates`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Template</Label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Start from a template…" />
                </SelectTrigger>
                <SelectContent>
                  {stageTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message</Label>
              <Textarea
                rows={9}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
            {emailFor && emailFor.length > 1 && (
              <p className="text-[11px] text-muted-foreground">
                Sent as one BCC&apos;d message, so names aren&apos;t
                personalised.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailFor(null)}>
              Cancel
            </Button>
            <Button className="gap-1.5" onClick={sendEmail}>
              <Mail className="w-4 h-4" /> Open in mail client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* §7.18 — offer modal */}
      <Dialog
        open={Boolean(offerFor)}
        onOpenChange={(o) => !o && setOfferFor(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Send offer to {offerFor?.name ?? "candidate"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Salary</Label>
              <Input
                type="number"
                min={0}
                placeholder={
                  requisition.salaryMin
                    ? `Band: ${requisition.salaryMin} – ${requisition.salaryMax}`
                    : "Annual salary"
                }
                value={offerSalary}
                onChange={(e) => setOfferSalary(e.target.value)}
              />
              {requisition.salaryMax > 0 &&
                Number(offerSalary) > requisition.salaryMax && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Above the approved band of {requisition.salaryMax}.
                  </p>
                )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Start date</Label>
              <Input
                type="date"
                value={offerStartDate}
                onChange={(e) => setOfferStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={3}
                placeholder="Anything the candidate should know — probation, benefits, conditions."
                value={offerNotes}
                onChange={(e) => setOfferNotes(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              This records the offer and opens your mail client. Come back and
              mark the response once they reply.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferFor(null)}>
              Cancel
            </Button>
            <Button className="gap-1.5" onClick={confirmOffer}>
              <FileSignature className="w-4 h-4" />
              Send offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview scoring — the gate out of "Scheduled for Interview" */}
      <Dialog
        open={Boolean(scoreFor)}
        onOpenChange={(v) => !v && setScoreFor(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {scoreFor && scoreFor.length === 1
                ? `Score ${scoreFor[0].name}'s interview`
                : `Score ${scoreFor?.length ?? 0} interviews`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              Record how the interview went. Once saved they move to{" "}
              <span className="font-medium text-foreground">Interviewed</span>,
              and this score is what the rest of the pipeline is judged on.
            </p>
            <div className="max-h-88 space-y-4 overflow-y-auto pr-1">
              {(scoreFor ?? []).map((c) => (
                <div
                  key={c.id}
                  className="space-y-2.5 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-1 truncate text-sm font-medium text-foreground">
                      {c.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[11px] text-muted-foreground">
                        Score
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        step={0.5}
                        className="h-8 w-20"
                        value={scores[c.id] ?? 3}
                        onChange={(e) =>
                          setScores((prev) => ({
                            ...prev,
                            [c.id]: Math.min(
                              5,
                              Math.max(1, Number(e.target.value) || 1),
                            ),
                          }))
                        }
                      />
                      <span className="text-[11px] text-muted-foreground">
                        / 5
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Recommendation</Label>
                    <Select
                      value={scoreRecs[c.id] ?? "yes"}
                      onValueChange={(v) =>
                        setScoreRecs((prev) => ({
                          ...prev,
                          [c.id]: v as ScorecardRecommendation,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strong_yes">Strong yes</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="strong_no">Strong no</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Interview notes</Label>
                    <Textarea
                      value={scoreNotes[c.id] ?? ""}
                      onChange={(e) =>
                        setScoreNotes((prev) => ({
                          ...prev,
                          [c.id]: e.target.value,
                        }))
                      }
                      placeholder="What was discussed, how they answered, anything the panel flagged…"
                      className="min-h-20 resize-none text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreFor(null)}>
              Cancel
            </Button>
            <Button onClick={applyScores}>Save &amp; move to Interviewed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recording what the candidate said about their offer */}
      <Dialog
        open={Boolean(responseFor)}
        onOpenChange={(v) => !v && setResponseFor(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {responseFor?.accepted
                ? `${responseFor.candidate.name} accepted the offer`
                : `${responseFor?.candidate.name} declined the offer`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              {responseFor?.accepted
                ? "This unlocks the Hired stage and moves them there."
                : "This closes them out of this pipeline — a declined offer can't be moved to Hired."}
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">
                What they said{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                placeholder={
                  responseFor?.accepted
                    ? "e.g. Accepted on the call, can start two weeks earlier than planned."
                    : "e.g. Took a counter-offer from their current employer."
                }
                className="min-h-20 resize-none text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseFor(null)}>
              Cancel
            </Button>
            <Button
              className={
                responseFor?.accepted
                  ? ""
                  : "bg-destructive text-white hover:bg-destructive/90"
              }
              onClick={confirmOfferResponse}
            >
              {responseFor?.accepted ? "Record acceptance" : "Record decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* §7.19 — rejection with a reason */}
      <Dialog open={Boolean(rejectFor)} onOpenChange={(v) => !v && setRejectFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {rejectFor && rejectFor.length === 1
                ? `Reject ${rejectFor[0].name}?`
                : `Reject ${rejectFor?.length ?? 0} candidates?`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmReject}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared confirmation dialog */}
      <AlertDialog
        open={Boolean(confirm)}
        onOpenChange={(v) => !v && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirm?.action();
                setConfirm(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
