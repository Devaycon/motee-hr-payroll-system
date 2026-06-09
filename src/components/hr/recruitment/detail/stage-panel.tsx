"use client";

import { useMemo, useState } from "react";
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
  scheduleInterview,
  completeInterviews,
  uid,
} from "@/src/lib/stores/recruitment-slice";
import { addPendingRecord } from "@/src/lib/demo/pending-onboarding";
import { STAGE_TYPE_LABELS } from "@/src/data/recruitment-demo";
import type {
  Candidate,
  Interview,
  InterviewMode,
  JobRequisition,
  RecruitmentStageType,
} from "@/src/lib/types/recruitment";
import { getFlow, nextEnabledStage, matchesConstraint } from "../flow";
import { candidateToOnboardingRecord } from "../preboard";
import { CandidateDrawer } from "../components/candidate-drawer";
import { openMailto } from "../components/mailto";

const ORANGE_TAB =
  "data-[state=active]:bg-[#ff8b2d]! data-[state=active]:text-white! data-[state=active]:shadow-none!";

interface StagePanelProps {
  country: string;
  requisition: JobRequisition;
  stage: RecruitmentStageType;
  candidates: Candidate[];
  interviews: Interview[];
}

type StatusTone = "new" | "scheduled" | "completed" | "invited" | "pending" | "rejected";

const STATUS_STYLES: Record<StatusTone, string> = {
  new: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  invited: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
};

const STATUS_LABELS: Record<StatusTone, string> = {
  new: "New",
  scheduled: "Scheduled",
  completed: "Completed",
  invited: "Invited",
  pending: "Pending",
  rejected: "Rejected",
};

export function StagePanel({
  country,
  requisition,
  stage,
  candidates,
  interviews,
}: StagePanelProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const templates = useAppSelector((s) => s.approvals.templates);
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);

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
  const [active, setActive] = useState<Candidate | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [filterId, setFilterId] = useState<string>("");

  // Confirmation dialog (advance-to-hired, reject all, etc.).
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

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

  function statusTone(c: Candidate): StatusTone {
    if (c.status === "rejected") return "rejected";
    if (stage === "interview") {
      return interviewStatusByCandidate.get(c.id) ?? "pending";
    }
    if (stage === "hired") {
      return invited.has(c.id) ? "invited" : "pending";
    }
    return "new";
  }

  // ── Actions ──
  function reject(ids: string[]) {
    dispatch(setCandidateStatus({ country, ids, status: "rejected" }));
  }
  function toggleReject(c: Candidate) {
    dispatch(
      setCandidateStatus({
        country,
        ids: [c.id],
        status: c.status === "rejected" ? "active" : "rejected",
      }),
    );
  }

  function emailOne(c: Candidate) {
    openMailto({ to: [c.email] });
  }
  function emailBulk() {
    const emails = activeInStage.map((c) => c.email).filter(Boolean);
    if (emails.length === 0) {
      toast.error("No candidates to email.");
      return;
    }
    openMailto({ bcc: emails });
  }

  // ── Onboarding invites (hired) ──
  function invite(c: Candidate) {
    if (!invited.has(c.id)) {
      addPendingRecord(
        candidateToOnboardingRecord(c, requisition, templates, roles),
      );
      setInvited((prev) => new Set(prev).add(c.id));
    }
    openMailto({
      to: [c.email],
      subject: `Welcome aboard — ${requisition.positionTitle}`,
      body: `Hi ${c.name},\n\nCongratulations! We'd like to begin your onboarding for the ${requisition.positionTitle} role. Please use the link in this email to get started.`,
    });
  }
  function inviteBulk() {
    const pending = activeInStage;
    if (pending.length === 0) {
      toast.error("No hires to invite.");
      return;
    }
    pending.forEach((c) => {
      if (!invited.has(c.id)) {
        addPendingRecord(
          candidateToOnboardingRecord(c, requisition, templates, roles),
        );
      }
    });
    setInvited((prev) => {
      const n = new Set(prev);
      pending.forEach((c) => n.add(c.id));
      return n;
    });
    openMailto({
      bcc: pending.map((c) => c.email).filter(Boolean),
      subject: `Onboarding invite — ${requisition.positionTitle}`,
      body: "Congratulations on your offer! Please follow the link to begin onboarding.",
    });
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
    setAdvanceFor(recipients);
    setRound("Interview 1");
    setScheduledAt("");
    setDurationMins(45);
    setMode("video");
    setLocation("");
    setMailSubject(`Interview invitation — ${requisition.positionTitle}`);
    setMailBody(
      "We'd like to invite you to an interview. Details to follow — please confirm your availability.",
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

  // ── Interview bulk status (one score for all, status → completed) ──
  const [scoreOpen, setScoreOpen] = useState(false);
  const [bulkScore, setBulkScore] = useState(4);
  function applyBulkScore() {
    if (activeInStage.length === 0) {
      toast.error("No interview candidates to update.");
      return;
    }
    dispatch(
      completeInterviews({
        country,
        candidateIds: activeInStage.map((c) => c.id),
        score: bulkScore,
        by: user?.name ?? "Recruiter",
      }),
    );
    toast.success(
      `${activeInStage.length} interview(s) marked completed (score ${bulkScore})`,
    );
    setScoreOpen(false);
  }

  // ── Advance a single interview-stage candidate → hired ──
  function advanceToHired(c: Candidate) {
    if (!nextStage) return;
    dispatch(moveStage({ country, ids: [c.id], stage: nextStage }));
    toast.success(`${c.name} moved to ${nextLabel}`);
  }

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
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const tone = statusTone(row.original);
          return (
            <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[tone]}`}>
              {STATUS_LABELS[tone]}
            </Badge>
          );
        },
      },
      {
        accessorKey: "score",
        header: sortableHeader("Score"),
        cell: ({ row }) =>
          row.original.score != null ? (
            <span className="text-sm text-foreground">
              {row.original.score.toFixed(1)}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
      },
      actionsColumn<Candidate>((c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2" onClick={() => setActive(c)}>
              <Eye className="w-3.5 h-3.5" /> View detail
            </DropdownMenuItem>

            {stage === "applicants" && nextStage && c.status === "active" && (
              <DropdownMenuItem className="gap-2" onClick={() => openAdvance([c])}>
                <ArrowRight className="w-3.5 h-3.5" /> Advance applicant
              </DropdownMenuItem>
            )}
            {stage === "interview" && nextStage && c.status === "active" && (
              <DropdownMenuItem
                className="gap-2"
                onClick={() =>
                  setConfirm({
                    title: `Advance ${c.name}?`,
                    description: `This moves ${c.name} to ${nextLabel}.`,
                    action: () => advanceToHired(c),
                  })
                }
              >
                <ArrowRight className="w-3.5 h-3.5" /> Advance applicant
              </DropdownMenuItem>
            )}
            {stage === "hired" && c.status === "active" && (
              <DropdownMenuItem className="gap-2" onClick={() => invite(c)}>
                <UserCheck className="w-3.5 h-3.5" /> Send onboarding invite
              </DropdownMenuItem>
            )}

            <DropdownMenuItem className="gap-2" onClick={() => emailOne(c)}>
              <Mail className="w-3.5 h-3.5" /> Send email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="gap-2"
              onClick={() => toggleReject(c)}
            >
              <X className="w-3.5 h-3.5" />
              {c.status === "rejected" ? "Restore" : "Reject"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, nextStage, nextLabel, invited, interviewStatusByCandidate, country]);

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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">
                {activeInStage.length} active in this tab
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {stage === "applicants" && nextStage && (
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => openAdvance(activeInStage)}
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Advance all → {nextLabel}
                </DropdownMenuItem>
              )}
              {stage === "interview" && (
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    setBulkScore(4);
                    setScoreOpen(true);
                  }}
                >
                  <ListChecks className="w-3.5 h-3.5" /> Bulk update status
                </DropdownMenuItem>
              )}
              {stage === "hired" && (
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() =>
                    setConfirm({
                      title: "Send onboarding invites?",
                      description: `This invites all ${activeInStage.length} active hire(s) to onboarding and opens your mail client.`,
                      action: inviteBulk,
                    })
                  }
                >
                  <UserCheck className="w-3.5 h-3.5" /> Send onboarding invites
                </DropdownMenuItem>
              )}

              <DropdownMenuItem className="gap-2" onClick={emailBulk}>
                <Mail className="w-3.5 h-3.5" /> Send bulk email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="gap-2"
                onClick={() =>
                  setConfirm({
                    title: "Reject all?",
                    description: `This rejects all ${activeInStage.length} active applicant(s) in this tab.`,
                    action: () => reject(activeInStage.map((c) => c.id)),
                  })
                }
              >
                <X className="w-3.5 h-3.5" /> Reject all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        onRowClick={(c) => setActive(c)}
        searchPlaceholder="Search applicants…"
        emptyMessage="No applicants in this stage."
      />

      {active && (
        <CandidateDrawer
          country={country}
          candidate={active}
          requisition={requisition}
          interviews={interviews}
          onClose={() => setActive(null)}
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

      {/* Interview bulk status / score modal */}
      <Dialog open={scoreOpen} onOpenChange={setScoreOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Bulk update interview status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              Apply one interview score to all {activeInStage.length} active
              candidate(s) in this tab. Their status changes to{" "}
              <span className="font-medium text-foreground">Completed</span>.
            </p>
            <div className="space-y-1.5">
              <Label>Interview score (0–5)</Label>
              <Input
                type="number"
                min={0}
                max={5}
                step={0.5}
                value={bulkScore}
                onChange={(e) =>
                  setBulkScore(
                    Math.min(5, Math.max(0, Number(e.target.value) || 0)),
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyBulkScore}>Mark completed</Button>
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
