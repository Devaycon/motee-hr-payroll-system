"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { Separator } from "@/src/components/ui/separator";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Download, ShieldCheck } from "lucide-react";
import {
  SURVEY_TYPE_CONFIG,
  SURVEY_STATUS_CONFIG,
  computeNpsBreakdown,
  getResponseRate,
} from "../data";
import type { Survey, SurveyQuestion } from "../types";

interface SurveyResultsModalProps {
  open: boolean;
  survey: Survey | null;
  onClose: () => void;
}

function getQuestionAggregate(survey: Survey, question: SurveyQuestion) {
  const allAnswers = survey.responses.flatMap((r) => {
    const qAns = r.answers.find((a) => a.questionId === question.id);
    return qAns ? qAns.answers : [];
  });
  return allAnswers;
}

function RatingAggregate({
  answers,
  min,
  max,
}: {
  answers: string[];
  min: number;
  max: number;
}) {
  const nums = answers.map((a) => parseInt(a, 10)).filter((n) => !isNaN(n));
  if (nums.length === 0)
    return <p className="text-sm text-muted-foreground">No responses</p>;
  const avg = nums.reduce((s, n) => s + n, 0) / nums.length;
  const distribution: Record<number, number> = {};
  for (let i = min; i <= max; i++) distribution[i] = 0;
  nums.forEach((n) => {
    if (distribution[n] !== undefined) distribution[n]++;
  });
  return (
    <div className="space-y-3">
      <p className="text-2xl font-bold text-foreground">
        {avg.toFixed(1)}
        <span className="text-sm text-muted-foreground font-normal ml-1">
          / {max} avg
        </span>
      </p>
      <div className="space-y-1.5">
        {Object.entries(distribution)
          .reverse()
          .map(([score, count]) => {
            const pct =
              nums.length > 0 ? Math.round((count / nums.length) * 100) : 0;
            return (
              <div key={score} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right text-muted-foreground">
                  {score}
                </span>
                <Progress value={pct} className="h-2 flex-1" />
                <span className="w-8 text-muted-foreground">{pct}%</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function LikertAggregate({
  answers,
  options,
}: {
  answers: string[];
  options: string[];
}) {
  if (answers.length === 0)
    return <p className="text-sm text-muted-foreground">No responses</p>;
  return (
    <div className="space-y-1.5">
      {options.map((opt) => {
        const count = answers.filter((a) => a === opt).length;
        const pct =
          answers.length > 0 ? Math.round((count / answers.length) * 100) : 0;
        return (
          <div key={opt} className="space-y-0.5">
            <div className="flex justify-between text-xs">
              <span className="text-foreground">{opt}</span>
              <span className="text-muted-foreground">
                {count} ({pct}%)
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        );
      })}
    </div>
  );
}

function MultiChoiceAggregate({
  answers,
  options,
}: {
  answers: string[];
  options: string[];
}) {
  if (answers.length === 0)
    return <p className="text-sm text-muted-foreground">No responses</p>;
  return (
    <div className="space-y-1.5">
      {options.map((opt) => {
        const count = answers.filter((a) => a === opt).length;
        const pct =
          answers.length > 0 ? Math.round((count / answers.length) * 100) : 0;
        return (
          <div key={opt} className="space-y-0.5">
            <div className="flex justify-between text-xs">
              <span className="text-foreground">{opt}</span>
              <span className="text-muted-foreground">
                {count} ({pct}%)
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        );
      })}
    </div>
  );
}

function YesNoAggregate({ answers }: { answers: string[] }) {
  if (answers.length === 0)
    return <p className="text-sm text-muted-foreground">No responses</p>;
  const yes = answers.filter((a) => a === "Yes").length;
  const no = answers.filter((a) => a === "No").length;
  const yesPct =
    answers.length > 0 ? Math.round((yes / answers.length) * 100) : 0;
  const noPct =
    answers.length > 0 ? Math.round((no / answers.length) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <div className="flex justify-between text-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            Yes
          </span>
          <span className="text-muted-foreground">
            {yes} ({yesPct}%)
          </span>
        </div>
        <Progress value={yesPct} className="h-2" />
      </div>
      <div className="space-y-0.5">
        <div className="flex justify-between text-xs">
          <span className="text-red-600 dark:text-red-400 font-medium">No</span>
          <span className="text-muted-foreground">
            {no} ({noPct}%)
          </span>
        </div>
        <Progress value={noPct} className="h-2" />
      </div>
    </div>
  );
}

function NpsAggregate({ survey }: { survey: Survey }) {
  const { promoters, passives, detractors, score } =
    computeNpsBreakdown(survey);
  const total = promoters + passives + detractors;
  const pPct = total > 0 ? Math.round((promoters / total) * 100) : 0;
  const pasPct = total > 0 ? Math.round((passives / total) * 100) : 0;
  const dPct = total > 0 ? Math.round((detractors / total) * 100) : 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <p
          className={`text-3xl font-bold ${score >= 50 ? "text-emerald-600 dark:text-emerald-400" : score >= 0 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}
        >
          {score > 0 ? "+" : ""}
          {score}
        </p>
        <p className="text-xs text-muted-foreground">eNPS Score</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Promoters",
            count: promoters,
            pct: pPct,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
            info: "Score 9–10",
          },
          {
            label: "Passives",
            count: passives,
            pct: pasPct,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10",
            info: "Score 7–8",
          },
          {
            label: "Detractors",
            count: detractors,
            pct: dPct,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-500/10",
            info: "Score 0–6",
          },
        ].map((g) => (
          <div key={g.label} className={`${g.bg} rounded-lg p-3 text-center`}>
            <p className={`text-xl font-bold ${g.color}`}>{g.count}</p>
            <p className="text-xs font-medium text-foreground">{g.label}</p>
            <p className="text-xs text-muted-foreground">
              {g.pct}% &bull; {g.info}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SurveyResultsModal({
  open,
  survey,
  onClose,
}: SurveyResultsModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setActiveTab("overview");
  }

  if (!survey) return null;

  const rate = getResponseRate(survey);
  const typeConfig = SURVEY_TYPE_CONFIG[survey.type];
  const statusConfig = SURVEY_STATUS_CONFIG[survey.status];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-base truncate">
                {survey.title}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs ${typeConfig.color} ${typeConfig.bg} ${typeConfig.border} gap-1`}
                >
                  {typeConfig.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
                >
                  {statusConfig.label}
                </Badge>
                {survey.isAnonymous && (
                  <Badge
                    variant="outline"
                    className="text-xs text-slate-600 bg-slate-500/10 border-slate-500/30 gap-1"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    Anonymous
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </div>

          <div className="mt-3 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground">
                Response Rate — {survey.responses.length} of{" "}
                {survey.totalTargeted} responded
              </p>
              <p className="text-sm font-semibold">{rate}%</p>
            </div>
            <Progress value={rate} className="h-2" />
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="w-full shrink-0">
            <TabsTrigger value="overview" className="flex-1 text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="responses"
              className="flex-1 text-xs"
              disabled={survey.isAnonymous}
            >
              Responses {survey.isAnonymous ? "(Anonymous)" : ""}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 text-xs">
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <TabsContent value="overview" className="mt-0 p-1 space-y-4">
              {survey.questions.map((q, idx) => {
                const answers = getQuestionAggregate(survey, q);
                return (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {idx + 1}. {q.text}
                    </p>
                    {q.type === "rating" && (
                      <RatingAggregate
                        answers={answers}
                        min={q.scaleMin ?? 1}
                        max={q.scaleMax ?? 5}
                      />
                    )}
                    {q.type === "nps" && <NpsAggregate survey={survey} />}
                    {q.type === "likert" && q.options && (
                      <LikertAggregate answers={answers} options={q.options} />
                    )}
                    {q.type === "multiple_choice" && q.options && (
                      <MultiChoiceAggregate
                        answers={answers}
                        options={q.options}
                      />
                    )}
                    {q.type === "yes_no" && (
                      <YesNoAggregate answers={answers} />
                    )}
                    {q.type === "open_text" && (
                      <div className="space-y-1.5">
                        {answers.filter((a) => a.trim() !== "").length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            No text responses
                          </p>
                        ) : (
                          answers
                            .filter((a) => a.trim() !== "")
                            .map((a, i) => (
                              <div
                                key={i}
                                className="bg-muted rounded-md px-3 py-2 text-sm text-foreground"
                              >
                                &ldquo;{a}&rdquo;
                              </div>
                            ))
                        )}
                      </div>
                    )}
                    {idx < survey.questions.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="responses" className="mt-0 p-1 space-y-3">
              {survey.responses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No responses yet.
                </p>
              )}
              {survey.responses.map((resp, idx) => (
                <div
                  key={resp.id}
                  className="bg-card border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <PersonAvatar
                      name={resp.respondentName ?? `Respondent ${idx + 1}`}
                      initials={resp.respondentInitials ?? `R${idx + 1}`}
                      className="w-8 h-8"
                      fallbackClassName="text-xs bg-primary/10 text-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {resp.respondentName ?? `Respondent ${idx + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {resp.respondentDept ?? ""} &bull; {resp.submittedAt}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {resp.answers.map((ans) => {
                      const q = survey.questions.find(
                        (qu) => qu.id === ans.questionId,
                      );
                      return (
                        <div key={ans.questionId} className="text-xs">
                          <p className="text-muted-foreground">
                            {q?.text ?? ans.questionId}
                          </p>
                          <p className="text-foreground font-medium mt-0.5">
                            {ans.answers.join(", ") || (
                              <span className="italic text-muted-foreground">
                                No answer
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="analytics" className="mt-0 p-1 space-y-4">
              {survey.type === "enps" ||
              survey.questions.some((q) => q.type === "nps") ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">eNPS Breakdown</p>
                  <NpsAggregate survey={survey} />
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm font-semibold">Response Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Targeted", value: survey.totalTargeted },
                    {
                      label: "Responses Received",
                      value: survey.responses.length,
                    },
                    { label: "Response Rate", value: `${rate}%` },
                    { label: "Questions", value: survey.questions.length },
                  ].map((s) => (
                    <div key={s.label} className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {survey.startDate && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Schedule</p>
                  <div className="bg-muted rounded-lg p-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date</span>
                      <span className="font-medium">{survey.startDate}</span>
                    </div>
                    {survey.endDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date</span>
                        <span className="font-medium">{survey.endDate}</span>
                      </div>
                    )}
                    {survey.pulseFrequency && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frequency</span>
                        <span className="font-medium capitalize">
                          {survey.pulseFrequency}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
