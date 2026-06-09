"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
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

export function useSurveys() {
  return useLocaleSection<Survey[]>(buildSurveys);
}
