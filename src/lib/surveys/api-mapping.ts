import type {
  EngagementPointDto,
  PulseFrequency as ApiPulse,
  QuestionType as ApiQuestionType,
  SurveyAudience as ApiAudience,
  SurveyDto,
  SurveyRequest,
  SurveyResultsDto,
  SurveyType as ApiSurveyType,
} from "@/src/types/surveys";
import type {
  EngagementTrendPoint,
  NewSurvey,
  PulseFrequency,
  QuestionType,
  Survey,
  SurveyAudience,
  SurveyResponse,
  SurveyType,
} from "@/src/lib/types/surveys";
import { initials } from "@/src/lib/helpdesk/api-mapping";

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export const surveyTypeFromApi = (t: ApiSurveyType) => snake(t) as SurveyType;
export const surveyTypeToApi = (t: SurveyType) => camel(t) as ApiSurveyType;
export const questionTypeFromApi = (t: ApiQuestionType) => snake(t) as QuestionType;
export const questionTypeToApi = (t: QuestionType) => camel(t) as ApiQuestionType;
export const audienceFromApi = (a: ApiAudience) => snake(a) as SurveyAudience;
export const audienceToApi = (a: SurveyAudience) => camel(a) as ApiAudience;
export const pulseFromApi = (p: ApiPulse) => snake(p) as PulseFrequency;
export const pulseToApi = (p: PulseFrequency) => camel(p) as ApiPulse;

type Departments = { id: string; name: string }[];

/**
 * The list shows response counts from `responses.length`, so a survey read
 * from the list carries that many empty placeholder responses. Opening the
 * results fills them in from `GET /surveys/{id}/results` (see below).
 */
export function surveyFromApi(dto: SurveyDto, departments: Departments): Survey {
  const deptName = new Map(departments.map((d) => [d.id, d.name]));
  const creator = dto.createdByName ?? "HR";
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    type: surveyTypeFromApi(dto.surveyType),
    status: dto.status,
    audience: audienceFromApi(dto.audience),
    targetDepartments: dto.targetDepartmentIds.map((id) => deptName.get(id) ?? id),
    isAnonymous: dto.isAnonymous,
    sendReminder: dto.sendReminder,
    questions: [...dto.questions]
      .sort((a, b) => a.sequence - b.sequence)
      .map((q) => ({
        id: q.id,
        text: q.text,
        type: questionTypeFromApi(q.questionType),
        required: q.required,
        options: q.options.length ? q.options : undefined,
        scaleMin: q.scaleMin ?? undefined,
        scaleMax: q.scaleMax ?? undefined,
      })),
    responses: Array.from({ length: dto.responses }, (_, i) => ({
      id: `${dto.id}-r${i}`,
      submittedAt: dto.updatedAt,
      answers: [],
    })),
    totalTargeted: dto.totalTargeted ?? 0,
    startDate: dto.startDate ?? undefined,
    endDate: dto.endDate ?? undefined,
    pulseFrequency: dto.pulseFrequency ? pulseFromApi(dto.pulseFrequency) : undefined,
    createdAt: dto.createdAt,
    createdBy: creator,
    createdByInitials: initials(creator),
    isArchived: dto.status === "archived",
  };
}

/**
 * The results modal tallies individual responses. The API returns the tally
 * itself (counts per value, open-text comments), so it is unrolled back into
 * anonymous responses that add up to the same counts.
 */
export function responsesFromResults(results: SurveyResultsDto): SurveyResponse[] {
  const total = Math.max(
    results.responses,
    ...results.questions.map((q) => q.answers),
    0,
  );
  const rows: SurveyResponse[] = Array.from({ length: total }, (_, i) => ({
    id: `${results.surveyId}-r${i}`,
    submittedAt: "",
    answers: [],
  }));
  for (const q of results.questions) {
    const values: string[][] = [];
    const counts = q.options.length ? q.options : q.distribution;
    for (const { value, count } of counts) {
      for (let n = 0; n < count; n++) values.push([value]);
    }
    for (const comment of q.comments) values.push([comment]);
    values.slice(0, total).forEach((answers, i) => {
      rows[i]!.answers.push({ questionId: q.questionId, answers });
    });
  }
  return rows;
}

export function surveyToRequest(s: NewSurvey, departments: Departments): SurveyRequest {
  const deptId = new Map(departments.map((d) => [d.name, d.id]));
  return {
    title: s.title,
    description: s.description || null,
    surveyType: surveyTypeToApi(s.type),
    audience: audienceToApi(s.audience),
    targetDepartmentIds: (s.targetDepartments ?? [])
      .map((name) => deptId.get(name))
      .filter((id): id is string => !!id),
    isAnonymous: s.isAnonymous,
    sendReminder: s.sendReminder,
    startDate: s.startDate || null,
    endDate: s.endDate || null,
    ...(s.pulseFrequency ? { pulseFrequency: pulseToApi(s.pulseFrequency) } : {}),
    status: s.status,
    questions: s.questions.map((q) => ({
      text: q.text,
      questionType: questionTypeToApi(q.type),
      required: q.required,
      options: q.options ?? null,
      scaleMin: q.scaleMin ?? null,
      scaleMax: q.scaleMax ?? null,
    })),
  };
}

/** The trend chart has fixed department series; others are left at 0. */
export function trendFromApi(points: EngagementPointDto[]): EngagementTrendPoint[] {
  const score = (p: EngagementPointDto, ...names: string[]) => {
    const row = p.byDepartment.find((d) =>
      names.some((n) => d.departmentName.toLowerCase().includes(n)),
    );
    return Math.round(row?.engagementScore ?? 0);
  };
  return points.map((p) => ({
    month: p.month,
    companyWide: Math.round(p.companyWide ?? 0),
    engineering: score(p, "engineer", "tech"),
    marketing: score(p, "marketing"),
    sales: score(p, "sales"),
    hr: score(p, "human", "hr", "people"),
    operations: score(p, "operation"),
  }));
}
