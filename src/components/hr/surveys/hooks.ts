"use client";

import { useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { isServerId, useIsLive, useLiveSender } from "@/src/lib/live/use-is-live";
import {
  responsesFromResults,
  surveyFromApi,
  surveyToRequest,
  trendFromApi,
} from "@/src/lib/surveys/api-mapping";
import { useGetAllSurveysQuery } from "@/src/store/services/collections";
import {
  useCreateSurveyMutation,
  useDeleteSurveyMutation,
  useGetEngagementTrendQuery,
  useLazyGetSurveyResultsQuery,
  useSetSurveyStatusMutation,
  useUpdateSurveyMutation,
} from "@/src/store/services/surveys";
import { ENGAGEMENT_TREND_DATA } from "./data";
import type { EngagementTrendPoint, NewSurvey } from "@/src/lib/types/surveys";
import type {
  QuestionType,
  Survey,
  SurveyAudience,
  SurveyResponse,
  SurveyStatus,
  SurveyType,
} from "@/src/lib/types/surveys";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawSurvey {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  audience?: string;
  isAnonymous?: boolean;
  questions?: { id?: string; text?: string; type?: string; required?: boolean; options?: string[]; scaleMin?: number; scaleMax?: number }[];
  responses?: { id?: string; respondentId?: string; submittedAt?: string; answers?: { questionId?: string; answers?: string[] }[] }[];
  totalTargeted?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

function mapType(t?: string): SurveyType {
  if (t === "pulse" || t === "enps" || t === "onboarding") return t;
  return "engagement";
}

function mapStatus(s?: string): SurveyStatus {
  if (s === "draft" || s === "scheduled" || s === "active" || s === "closed" || s === "archived") return s;
  return "draft";
}

function mapAudience(a?: string): SurveyAudience {
  if (a === "department" || a === "managers") return a;
  return "all_staff";
}

function mapQuestionType(t?: string): QuestionType {
  if (
    t === "multiple_choice" ||
    t === "rating" ||
    t === "likert" ||
    t === "open_text" ||
    t === "nps" ||
    t === "yes_no"
  )
    return t;
  return "rating";
}

function buildSurveys(bundle: LocaleBundle): Survey[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const surveysObj = bundle.surveys as { surveys?: RawSurvey[] };
  const raw = (surveysObj.surveys ?? []) as RawSurvey[];

  return raw.map((s, i) => {
    const id = s.id ?? `SRV-${String(i + 1).padStart(3, "0")}`;
    const responses: SurveyResponse[] = (s.responses ?? []).map((r, j) => {
      const emp = r.respondentId ? employeesById.get(r.respondentId) : null;
      return {
        id: r.id ?? `${id}-r${j + 1}`,
        respondentName: emp?.fullName,
        respondentInitials: emp?.initials,
        respondentDept: emp?.departmentName,
        submittedAt: r.submittedAt ?? bundle.tenant.createdAt.slice(0, 10),
        answers: (r.answers ?? []).map((a) => ({
          questionId: a.questionId ?? "",
          answers: a.answers ?? [],
        })),
      };
    });

    return {
      id,
      title: s.title ?? "Survey",
      description: s.description ?? "",
      type: mapType(s.type),
      status: mapStatus(s.status),
      audience: mapAudience(s.audience),
      isAnonymous: s.isAnonymous ?? false,
      sendReminder: true,
      questions: (s.questions ?? []).map((q, j) => ({
        id: q.id ?? `q${j + 1}`,
        text: q.text ?? "",
        type: mapQuestionType(q.type),
        required: q.required ?? false,
        options: q.options,
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
      })),
      responses,
      totalTargeted: s.totalTargeted ?? bundle.employees.length,
      startDate: s.startDate,
      endDate: s.endDate,
      createdAt: s.createdAt ?? bundle.tenant.createdAt.slice(0, 10),
      createdBy: "HR Admin",
      createdByInitials: "HA",
      isArchived: s.status === "archived",
    };
  });
}

function useDepartments() {
  const departments = useAppSelector((s) => s.locale.data?.departments);
  return useMemo(
    () => (departments ?? []).map((d) => ({ id: d.id, name: d.name })),
    [departments],
  );
}

/** Every survey: from the API when signed in, the bundle otherwise. */
export function useSurveys() {
  const live = useIsLive();
  const demo = useLocaleSection<Survey[]>(buildSurveys);
  const departments = useDepartments();
  const q = useGetAllSurveysQuery(undefined, { skip: !live });
  const data = useMemo(
    () => (q.data ? q.data.map((s) => surveyFromApi(s, departments)) : null),
    [q.data, departments],
  );
  if (!live) return demo;
  return { data, loading: q.isLoading, error: null };
}

/**
 * The engagement trend. Signed in it is the server series (padded to two
 * points so the month-on-month change still reads); signed out the demo one.
 */
export function useEngagementTrendData(): EngagementTrendPoint[] {
  const live = useIsLive();
  const q = useGetEngagementTrendQuery({ months: 12 }, { skip: !live });
  return useMemo(() => {
    if (!live) return ENGAGEMENT_TREND_DATA;
    const points = trendFromApi(q.data?.data ?? []);
    const empty = (month: string): EngagementTrendPoint => ({
      month,
      companyWide: 0,
      engineering: 0,
      marketing: 0,
      sales: 0,
      hr: 0,
      operations: 0,
    });
    while (points.length < 2) points.unshift(empty(points.length ? "—" : "Now"));
    return points;
  }, [live, q.data]);
}

/** Sends the survey screens' changes to the API (no-ops signed out). */
export function useSurveyActions() {
  const live = useIsLive();
  const send = useLiveSender(["Surveys"]);
  const departments = useDepartments();
  const [create] = useCreateSurveyMutation();
  const [update] = useUpdateSurveyMutation();
  const [remove] = useDeleteSurveyMutation();
  const [setStatus] = useSetSurveyStatusMutation();
  const [loadResults] = useLazyGetSurveyResultsQuery();
  const done = Promise.resolve(true);

  return useMemo(() => {
    const on = (id: string) => live && isServerId(id);
    return {
      live,
      create: (s: NewSurvey) =>
        live
          ? send(() => create(surveyToRequest(s, departments)).unwrap(), "Could not create the survey.")
          : done,
      update: (id: string, s: NewSurvey) =>
        on(id)
          ? send(
              () => update({ id, body: surveyToRequest(s, departments) }).unwrap(),
              "Could not save the survey.",
            )
          : done,
      status: (id: string, status: SurveyStatus) =>
        on(id)
          ? send(() => setStatus({ id, body: { status } }).unwrap(), "Could not change the survey status.")
          : done,
      remove: (id: string) =>
        on(id) ? send(() => remove(id).unwrap(), "Could not delete the survey.") : done,
      /** The survey with its responses filled in from the server tally. */
      withResults: async (survey: Survey): Promise<Survey> => {
        if (!on(survey.id)) return survey;
        try {
          const res = await loadResults(survey.id).unwrap();
          return { ...survey, responses: responsesFromResults(res.data) };
        } catch {
          return survey;
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, send, departments, create, update, remove, setStatus, loadResults]);
}
