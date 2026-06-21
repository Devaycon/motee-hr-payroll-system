"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Star,
  CalendarPlus,
  Mail,
  FileText,
  Bell,
  Download,
  ExternalLink,
  UserCheck,
  ChevronDown,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { addPendingRecord } from "@/src/lib/demo/pending-onboarding";
import { buildTasksForSelection } from "@/src/components/hr/onboarding/instantiate";
import type { OnboardingRecord } from "@/src/components/hr/onboarding/types";
import {
  addScorecard,
  addCommunication,
  addOffer,
  setOfferStatus,
  scheduleInterview,
  cancelInterview,
  markReminder,
  moveStage,
  setCandidateStatus,
  uid,
} from "@/src/lib/stores/recruitment-slice";
import {
  STAGE_TYPE_LABELS,
  STAGE_TYPE_STYLES,
  SOURCE_LABELS,
} from "@/src/data/recruitment-demo";
import type {
  ApplicationFormField,
  RecruitmentStageType,
  Candidate,
  Interview,
  InterviewMode,
  JobRequisition,
  Scorecard,
} from "@/src/lib/types/recruitment";
import {
  icsDataUrl,
  googleCalUrl,
  outlookCalUrl,
  teamsUrl,
  interviewTitle,
} from "./calendar-links";
import { getFlow, enabledStages, synthResponse } from "../flow";
import { cn } from "@/src/lib/utils";

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >
          <Star
            className={cn(
              "w-4 h-4 transition-colors",
              s <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}

interface Props {
  country: string;
  candidate: Candidate;
  requisition?: JobRequisition;
  interviews: Interview[];
  onClose: () => void;
}

export function CandidateDrawer({
  country,
  candidate,
  requisition,
  interviews,
  onClose,
}: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const templates = useAppSelector((s) => s.approvals.templates);
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);

  const myInterviews = interviews.filter(
    (i) => i.candidateId === candidate.id,
  );

  // Stage options are the requisition's enabled stages (fallback to all types).
  const stageOptions: RecruitmentStageType[] = requisition
    ? enabledStages(getFlow(requisition))
    : (Object.keys(STAGE_TYPE_LABELS) as RecruitmentStageType[]);

  const [tab, setTab] = useState("profile");

  const applicationForm = requisition?.applicationForm ?? [];

  // First few tabs render inline; the rest collapse into a "More" dropdown.
  const tabs = [
    { value: "profile", label: "Profile" },
    { value: "application", label: `Application (${applicationForm.length})` },
    { value: "interviews", label: `Interviews (${myInterviews.length})` },
    { value: "score", label: `Score (${candidate.scorecards.length})` },
    { value: "comms", label: `Comms (${candidate.communications.length})` },
    { value: "offers", label: `Offers (${candidate.offers.length})` },
    { value: "files", label: `Files (${candidate.attachments.length})` },
  ];
  const INLINE = 4;
  const inlineTabs = tabs.slice(0, INLINE);
  const overflowTabs = tabs.slice(INLINE);

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="min-w-xl overflow-y-auto overflow-x-hidden p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {candidate.initials}
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate">{candidate.name}</SheetTitle>
              <p className="text-xs text-muted-foreground truncate">
                {candidate.requisitionTitle} ·{" "}
                {SOURCE_LABELS[candidate.source] ?? candidate.source}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-3">
            <Badge
              variant="outline"
              className={cn("text-[10px]", STAGE_TYPE_STYLES[candidate.stage])}
            >
              {STAGE_TYPE_LABELS[candidate.stage]}
            </Badge>
            {candidate.status === "rejected" && (
              <Badge
                variant="outline"
                className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
              >
                Rejected
              </Badge>
            )}
            {candidate.score != null && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {candidate.score.toFixed(1)} / 5
              </Badge>
            )}
            <Select
              value={candidate.stage}
              onValueChange={(v) =>
                dispatch(
                  moveStage({
                    country,
                    ids: [candidate.id],
                    stage: v as RecruitmentStageType,
                  }),
                )
              }
            >
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stageOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_TYPE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {candidate.status === "rejected" ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-[11px]"
                onClick={() =>
                  dispatch(
                    setCandidateStatus({
                      country,
                      ids: [candidate.id],
                      status: "active",
                    }),
                  )
                }
              >
                <X className="w-3 h-3" />
                Restore
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    className="h-7 gap-1 text-[11px] bg-red-600 text-white hover:bg-red-700"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject {candidate.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This marks {candidate.name} as rejected. You can restore
                      them later from this panel.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() =>
                        dispatch(
                          setCandidateStatus({
                            country,
                            ids: [candidate.id],
                            status: "rejected",
                          }),
                        )
                      }
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {candidate.stage === "hired" && (
              <Button
                size="sm"
                className="h-7 gap-1 text-[11px]"
                onClick={() => {
                  const id = `onb-${Date.now()}`;
                  const { tasks, template } = buildTasksForSelection(
                    id,
                    templates,
                    roles,
                  );
                  const rec: OnboardingRecord = {
                    id,
                    employeeName: candidate.name,
                    employeeInitials: candidate.initials,
                    email: candidate.email,
                    jobTitle: requisition?.positionTitle ?? "New hire",
                    department: requisition?.department ?? "—",
                    startDate:
                      requisition?.targetStartDate ??
                      new Date().toISOString().slice(0, 10),
                    stage: "pre_boarding",
                    status: "not_started",
                    workflowTemplateId: template?.id,
                    workflowName: template?.name,
                    tasks,
                    completedTasks: 0,
                    totalTasks: tasks.length,
                    welcomeEmailSent: false,
                    initiatedAt: new Date().toISOString().slice(0, 10),
                    mode: "invited",
                  };
                  addPendingRecord(rec);
                  toast.success("Sent to onboarding");
                }}
              >
                <UserCheck className="w-3 h-3" /> Send to onboarding
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <TabsList className="h-9">
              {inlineTabs.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="text-sm px-3 data-[state=active]:bg-[#ff8b2d]! data-[state=active]:text-white! data-[state=active]:shadow-none!"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {overflowTabs.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 gap-1",
                      overflowTabs.some((t) => t.value === tab) &&
                        "bg-[#ff8b2d] text-white hover:bg-[#ff8b2d]/90 hover:text-white border-transparent",
                    )}
                  >
                    More
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {overflowTabs.map((t) => (
                    <DropdownMenuItem
                      key={t.value}
                      onClick={() => setTab(t.value)}
                    >
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <TabsContent value="profile" className="mt-5">
            <ProfileTab candidate={candidate} />
          </TabsContent>
          <TabsContent value="application" className="mt-5">
            <ApplicationTab candidate={candidate} form={applicationForm} />
          </TabsContent>
          <TabsContent value="interviews" className="mt-5">
            <InterviewsTab
              country={country}
              candidate={candidate}
              interviews={myInterviews}
              employees={employees.map((e) => ({ id: e.id, name: e.fullName }))}
            />
          </TabsContent>
          <TabsContent value="score" className="mt-5">
            <ScorecardsTab
              country={country}
              candidate={candidate}
              actorName={user?.name ?? "Me"}
            />
          </TabsContent>
          <TabsContent value="comms" className="mt-5">
            <CommsTab
              country={country}
              candidate={candidate}
              actorName={user?.name ?? "Me"}
            />
          </TabsContent>
          <TabsContent value="offers" className="mt-5">
            <OffersTab country={country} candidate={candidate} />
          </TabsContent>
          <TabsContent value="files" className="mt-5">
            <FilesTab candidate={candidate} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function ProfileTab({ candidate }: { candidate: Candidate }) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <Row label="Email" value={candidate.email} />
      <Row label="Phone" value={candidate.phone ?? "—"} />
      <Row label="LinkedIn" value={candidate.linkedin ?? "—"} />
      <Row label="Applied" value={candidate.appliedAt} />
      {candidate.experienceSummary && (
        <div>
          <p className="text-[11px] text-muted-foreground">Experience</p>
          <p className="text-foreground mt-3">{candidate.experienceSummary}</p>
        </div>
      )}
      {candidate.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {candidate.skills.map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px]">
              {s}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationTab({
  candidate,
  form,
}: {
  candidate: Candidate;
  form: ApplicationFormField[];
}) {
  if (form.length === 0)
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          No application form
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          This role has no custom application form.
        </p>
      </div>
    );
  return (
    <div className="flex flex-col gap-4 text-sm">
      {form.map((f) => {
        const answer = synthResponse(candidate, f);
        return (
          <div key={f.id} className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">
              {f.label}
              {f.required && <span className="text-destructive"> *</span>}
            </p>
            <p className="wrap-break-word text-foreground">{answer ?? "—"}</p>
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-foreground text-sm truncate">{value}</span>
    </div>
  );
}

function InterviewsTab({
  country,
  candidate,
  interviews,
  employees,
}: {
  country: string;
  candidate: Candidate;
  interviews: Interview[];
  employees: { id: string; name: string }[];
}) {
  const dispatch = useAppDispatch();
  const [round, setRound] = useState("Interview 1");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMins, setDurationMins] = useState(45);
  const [mode, setMode] = useState<InterviewMode>("video");
  const [panel, setPanel] = useState<string[]>([]);
  const [location, setLocation] = useState("");

  const empById = useMemo(
    () => new Map(employees.map((e) => [e.id, e.name])),
    [employees],
  );

  function schedule() {
    if (!scheduledAt) {
      toast.error("Pick a date & time.");
      return;
    }
    const iv: Interview = {
      id: uid("IV"),
      candidateId: candidate.id,
      candidateName: candidate.name,
      requisitionId: candidate.requisitionId,
      round,
      scheduledAt,
      durationMins,
      mode,
      panel,
      panelNames: panel.map((id) => empById.get(id) ?? id),
      location: location || undefined,
      status: "scheduled",
    };
    dispatch(scheduleInterview({ country, interview: iv }));
    toast.success("Interview scheduled");
    setScheduledAt("");
    setPanel([]);
    setLocation("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border p-3 space-y-2.5">
        <p className="text-xs font-semibold text-foreground">Schedule interview</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Round (e.g. Interview 1)"
            value={round}
            onChange={(e) => setRound(e.target.value)}
            className="h-8 text-sm"
          />
          <Select value={mode} onValueChange={(v) => setMode(v as InterviewMode)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="onsite">Onsite</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            type="number"
            min={15}
            step={15}
            value={durationMins}
            onChange={(e) => setDurationMins(Number(e.target.value) || 45)}
            className="h-8 text-sm"
          />
        </div>
        <Input
          placeholder="Location / meeting link (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-8 text-sm"
        />
        <div className="space-y-1.5">
          <Label className="text-[11px]">Panel</Label>
          <div className="flex flex-wrap gap-1">
            {panel.map((id) => (
              <Badge key={id} variant="secondary" className="text-[10px] gap-1">
                {empById.get(id) ?? id}
                <button
                  onClick={() => setPanel((p) => p.filter((x) => x !== id))}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </div>
          <Select
            value=""
            onValueChange={(v) =>
              setPanel((p) => (p.includes(v) ? p : [...p, v]))
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Add panellist…" />
            </SelectTrigger>
            <SelectContent>
              {employees.slice(0, 40).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={schedule}>
          <CalendarPlus className="w-3.5 h-3.5" /> Schedule
        </Button>
      </div>

      {interviews.length === 0 ? (
        <p className="text-xs text-muted-foreground">No interviews yet.</p>
      ) : (
        interviews.map((iv) => (
          <div
            key={iv.id}
            className={cn(
              "rounded-md border border-border p-3 space-y-2",
              iv.status === "cancelled" && "opacity-50",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {interviewTitle(iv)}
              </p>
              <Badge variant="outline" className="text-[10px] capitalize">
                {iv.mode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(iv.scheduledAt).toLocaleString()} · {iv.durationMins}m
              {iv.panelNames.length ? ` · ${iv.panelNames.join(", ")}` : ""}
            </p>
            {iv.status !== "cancelled" && (
              <div className="flex flex-wrap items-center gap-1.5">
                <a href={icsDataUrl(iv)} download={`${iv.round}.ics`}>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]">
                    <Download className="w-3 h-3" /> ICS
                  </Button>
                </a>
                <CalLink href={googleCalUrl(iv)} label="Google" />
                <CalLink href={outlookCalUrl(iv)} label="Outlook" />
                <CalLink href={teamsUrl(iv)} label="Teams" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() => {
                    dispatch(markReminder({ country, id: iv.id }));
                    toast.success("Reminder sent to panel & candidate");
                  }}
                >
                  <Bell className="w-3 h-3" />
                  {iv.reminderSent ? "Reminded" : "Remind"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] text-destructive"
                  onClick={() => dispatch(cancelInterview({ country, id: iv.id }))}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function CalLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]">
        <ExternalLink className="w-3 h-3" /> {label}
      </Button>
    </a>
  );
}

const DEFAULT_CRITERIA = ["Technical", "Communication", "Culture fit"];

function ScorecardsTab({
  country,
  candidate,
  actorName,
}: {
  country: string;
  candidate: Candidate;
  actorName: string;
}) {
  const dispatch = useAppDispatch();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");

  function submit() {
    const criteria = DEFAULT_CRITERIA.map((label) => ({
      label,
      score: scores[label] ?? 0,
    }));
    const rated = criteria.filter((c) => c.score > 0);
    if (rated.length === 0) {
      toast.error("Rate at least one criterion.");
      return;
    }
    const overall = Math.round(
      rated.reduce((s, c) => s + c.score, 0) / rated.length,
    );
    const sc: Scorecard = {
      id: uid("SC"),
      by: actorName,
      at: new Date().toISOString().slice(0, 10),
      criteria,
      overall,
      comment: comment || undefined,
      recommendation: overall >= 4 ? "yes" : "no",
    };
    dispatch(addScorecard({ country, candidateId: candidate.id, scorecard: sc }));
    toast.success("Scorecard saved");
    setScores({});
    setComment("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border p-3 space-y-2.5">
        <p className="text-xs font-semibold text-foreground">Add interview score</p>
        {DEFAULT_CRITERIA.map((label) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{label}</span>
            <StarInput
              value={scores[label] ?? 0}
              onChange={(v) => setScores((s) => ({ ...s, [label]: v }))}
            />
          </div>
        ))}
        <Textarea
          rows={2}
          placeholder="Comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="text-sm"
        />
        <Button size="sm" className="h-8" onClick={submit}>
          Save scorecard
        </Button>
      </div>

      {candidate.scorecards.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
          <Star className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">
            No interview score yet
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scores appear here once an interview has been completed and scored.
          </p>
        </div>
      ) : (
        candidate.scorecards.map((sc) => (
          <div key={sc.id} className="rounded-md border border-border p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{sc.by}</span>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {sc.overall}/5
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {sc.criteria.map((c) => (
                <span key={c.label} className="text-[11px] text-muted-foreground">
                  {c.label}: {c.score}
                </span>
              ))}
            </div>
            {sc.comment && (
              <p className="text-xs text-muted-foreground">{sc.comment}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function CommsTab({
  country,
  candidate,
  actorName,
}: {
  country: string;
  candidate: Candidate;
  actorName: string;
}) {
  const dispatch = useAppDispatch();
  const [channel, setChannel] = useState<"email" | "phone" | "note">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function log() {
    if (!body.trim()) {
      toast.error("Add a message.");
      return;
    }
    dispatch(
      addCommunication({
        country,
        candidateIds: [candidate.id],
        comm: {
          at: new Date().toISOString().slice(0, 10),
          channel,
          subject: subject || undefined,
          body: body.trim(),
          by: actorName,
        },
      }),
    );
    toast.success("Logged");
    setSubject("");
    setBody("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
            <SelectTrigger className="h-8 w-28 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-8 text-sm flex-1"
          />
        </div>
        <Textarea
          rows={2}
          placeholder="Message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="text-sm"
        />
        <Button size="sm" className="h-8 gap-1.5" onClick={log}>
          <Mail className="w-3.5 h-3.5" /> Log communication
        </Button>
      </div>
      {candidate.communications.map((c) => (
        <div key={c.id} className="rounded-md border border-border p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium capitalize">
              {c.channel}
              {c.subject ? ` · ${c.subject}` : ""}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {c.at} · {c.by}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{c.body}</p>
        </div>
      ))}
    </div>
  );
}

function OffersTab({
  country,
  candidate,
}: {
  country: string;
  candidate: Candidate;
}) {
  const dispatch = useAppDispatch();
  const [salary, setSalary] = useState(0);
  const [startDate, setStartDate] = useState("");

  function make() {
    dispatch(
      addOffer({
        country,
        candidateId: candidate.id,
        offer: {
          id: uid("OF"),
          at: new Date().toISOString().slice(0, 10),
          status: "sent",
          salary: salary || undefined,
          startDate: startDate || undefined,
        },
      }),
    );
    toast.success("Offer sent");
    setSalary(0);
    setStartDate("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border p-3 space-y-2.5">
        <p className="text-xs font-semibold text-foreground">Make offer</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Salary"
            value={salary || ""}
            onChange={(e) => setSalary(Number(e.target.value) || 0)}
            className="h-8 text-sm"
          />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <Button size="sm" className="h-8" onClick={make}>
          Send offer
        </Button>
      </div>
      {candidate.offers.map((o) => (
        <div key={o.id} className="rounded-md border border-border p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] capitalize">
              {o.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{o.at}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {o.salary ? formatMoneyLocale(o.salary) : "—"}
            {o.startDate ? ` · starts ${o.startDate}` : ""}
          </p>
          {o.status === "sent" && (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() =>
                  dispatch(
                    setOfferStatus({
                      country,
                      candidateId: candidate.id,
                      offerId: o.id,
                      status: "accepted",
                    }),
                  )
                }
              >
                Mark accepted
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] text-destructive"
                onClick={() =>
                  dispatch(
                    setOfferStatus({
                      country,
                      candidateId: candidate.id,
                      offerId: o.id,
                      status: "rejected",
                    }),
                  )
                }
              >
                Mark rejected
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FilesTab({ candidate }: { candidate: Candidate }) {
  if (candidate.attachments.length === 0)
    return <p className="text-xs text-muted-foreground">No attachments.</p>;
  return (
    <div className="flex flex-col gap-2">
      {candidate.attachments.map((a) => (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
        >
          <FileText className="w-4 h-4 text-muted-foreground" />
          {a.name}
        </a>
      ))}
    </div>
  );
}
