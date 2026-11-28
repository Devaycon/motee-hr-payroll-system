"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, ClipboardList, Lock, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { HrStatCardsGrid, type HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useIsLive, useLiveSender } from "@/src/lib/live/use-is-live";
import { surveyFromApi } from "@/src/lib/surveys/api-mapping";
import { formatDate } from "@/src/lib/utils/format-date";
import { SURVEY_TYPE_CONFIG } from "@/src/data/surveys-demo";
import { useSurveys } from "@/src/components/hr/surveys/hooks";
import {
  useGetMySurveyResponseQuery,
  useGetMySurveysQuery,
  useGetSurveyQuery,
  useSubmitSurveyResponseMutation,
} from "@/src/store/services/surveys";
import type { Survey } from "@/src/lib/types/surveys";
import { TakeSurveyModal } from "./take-survey-modal";

interface Row {
  survey: Survey;
  answered: boolean;
}

const DAY_MS = 86_400_000;
const daysLeft = (iso?: string) =>
  iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS) : null;

/**
 * Company → Surveys. The surveys HR has sent you: answer the open ones and
 * read back what you said. Signed in it uses GET /surveys/mine, GET
 * /surveys/{id}, GET /surveys/{id}/my-response and POST /surveys/{id}/responses.
 */
export function MySurveysPage() {
  const live = useIsLive();
  const departments = useAppSelector((s) => s.locale.data?.departments);
  const deptList = useMemo(
    () => (departments ?? []).map((d) => ({ id: d.id, name: d.name })),
    [departments],
  );
  const mine = useGetMySurveysQuery(undefined, { skip: !live });
  const demo = useSurveys();
  const [demoAnswered, setDemoAnswered] = useState<Record<string, Record<string, string[]>>>({});

  const rows = useMemo<Row[] | null>(() => {
    if (live) {
      if (!mine.data) return null;
      return mine.data.data
        .filter((d) => d.status === "active" || d.haveIAnswered)
        .map((d) => ({ survey: surveyFromApi(d, deptList), answered: d.haveIAnswered }));
    }
    if (!demo.data) return null;
    return demo.data
      .filter((s) => s.status === "active" && !s.isArchived)
      .map((s) => ({ survey: s, answered: !!demoAnswered[s.id] }));
  }, [live, mine.data, deptList, demo.data, demoAnswered]);

  const [tab, setTab] = useState("open");
  const [opened, setOpened] = useState<Row | null>(null);

  // Signed in, the opened survey and your answers are read fresh.
  const detail = useGetSurveyQuery(opened?.survey.id ?? "", { skip: !live || !opened });
  const myResponse = useGetMySurveyResponseQuery(opened?.survey.id ?? "", {
    skip: !live || !opened?.answered,
  });
  const [submit] = useSubmitSurveyResponseMutation();
  const send = useLiveSender(["Surveys"]);

  const questions = opened
    ? live
      ? detail.data?.data
        ? surveyFromApi(detail.data.data, deptList).questions
        : null
      : opened.survey.questions
    : null;
  const submitted = opened?.answered
    ? live
      ? myResponse.data?.data.answers
        ? Object.fromEntries(myResponse.data.data.answers.map((a) => [a.questionId, a.values]))
        : {}
      : (demoAnswered[opened.survey.id] ?? {})
    : null;

  async function handleSubmit(answers: Record<string, string[]>) {
    if (!opened) return false;
    const id = opened.survey.id;
    if (!live) {
      setDemoAnswered((prev) => ({ ...prev, [id]: answers }));
      toast.success("Thanks — your answers were submitted.");
      return true;
    }
    const ok = await send(
      () =>
        submit({
          id,
          body: {
            answers: Object.entries(answers)
              .filter(([, v]) => v.some((x) => x.trim()))
              .map(([questionId, values]) => ({ questionId, values })),
          },
        }).unwrap(),
      "Could not submit your answers.",
    );
    if (ok) toast.success("Thanks — your answers were submitted.");
    return ok;
  }

  const open = (rows ?? []).filter((r) => !r.answered);
  const done = (rows ?? []).filter((r) => r.answered);
  const closingSoon = open.filter((r) => {
    const d = daysLeft(r.survey.endDate);
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const cards: HrStatCardItem[] = [
    {
      label: "To Answer",
      value: open.length,
      sub: "Open surveys waiting on you",
      zeroSub: "You're all caught up",
      icon: ClipboardList,
      tone: "amber",
      active: tab === "open",
      onClick: () => setTab("open"),
    },
    {
      label: "Answered",
      value: done.length,
      sub: "Surveys you've completed",
      zeroSub: "None answered yet",
      icon: CheckCircle2,
      tone: "emerald",
      active: tab === "done",
      onClick: () => setTab("done"),
    },
    {
      label: "Closing This Week",
      value: closingSoon,
      sub: "Answer before they close",
      zeroSub: "Nothing closing this week",
      icon: CalendarClock,
      tone: "red",
      onClick: () => setTab("open"),
    },
  ];

  const list = (items: Row[], empty: string) =>
    items.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((r) => {
          const type = SURVEY_TYPE_CONFIG[r.survey.type] ?? SURVEY_TYPE_CONFIG.engagement;
          const left = daysLeft(r.survey.endDate);
          return (
            <Card key={r.survey.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className={`${type.bg} ${type.color} ${type.border} text-[10px]`}>
                      {type.label}
                    </Badge>
                    {r.survey.isAnonymous && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Lock className="size-2.5" /> Anonymous
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7" aria-label={`Actions for ${r.survey.title}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => setOpened(r)}>
                        {r.answered ? "View my answers" : "Take survey"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{r.survey.title}</p>
                  {r.survey.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.survey.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>
                    {r.survey.questions.length} question{r.survey.questions.length === 1 ? "" : "s"}
                    {r.survey.endDate && ` · closes ${formatDate(r.survey.endDate)}`}
                    {left !== null && left >= 0 && left <= 7 && !r.answered && (
                      <span className="text-red-600"> ({left === 0 ? "today" : `${left}d left`})</span>
                    )}
                  </span>
                  <Button size="sm" variant={r.answered ? "outline" : "default"} className="h-7 text-xs" onClick={() => setOpened(r)}>
                    {r.answered ? "View answers" : "Take survey"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="w-fit py-6">
        <h1 className="text-4xl font-bold text-foreground">Surveys</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Have your say. Answer the surveys HR sends you and look back at what you said.
        </p>
      </div>

      {!rows ? (
        <>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </>
      ) : (
        <>
          <HrStatCardsGrid stats={cards} columns={3} />
          <Tabs value={tab} onValueChange={setTab}>
            <PageTabsList
              tabs={[
                { value: "open", label: `To Answer (${open.length})` },
                { value: "done", label: `Answered (${done.length})` },
              ]}
            />
            <TabsContent value="open" className="mt-4">
              {list(open, "No surveys are waiting for you.")}
            </TabsContent>
            <TabsContent value="done" className="mt-4">
              {list(done, "You haven't answered any surveys yet.")}
            </TabsContent>
          </Tabs>
        </>
      )}

      <TakeSurveyModal
        open={!!opened}
        title={opened?.survey.title ?? ""}
        description={opened?.survey.description}
        isAnonymous={!!opened?.survey.isAnonymous}
        questions={questions}
        submitted={submitted}
        onClose={() => setOpened(null)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
