import type {
  ApplicationFormField,
  Candidate,
  CriteriaGate,
  FilterConstraint,
  FlowStage,
  JobRequisition,
  QuizGate,
  RecruitmentStageType,
  RequisitionFlow,
} from "@/src/lib/types/recruitment";
import {
  RECRUITMENT_STAGE_TYPES,
  defaultFlow,
} from "@/src/data/recruitment-demo";

// ── Flow accessors ───────────────────────────────────────────────────────────

/**
 * A requisition's saved flow, or the default all-stages-manual flow.
 *
 * §7.18 — a flow saved before the `offer` stage existed has no entry for it,
 * which would silently drop the stage from that requisition's pipeline
 * forever. Any stage missing from a stored flow is filled in from the default,
 * so old requisitions gain new stages instead of quietly losing them.
 */
export function getFlow(req: JobRequisition): RequisitionFlow {
  const fallback = defaultFlow();
  if (!req.flow) return fallback;

  const saved = new Map(req.flow.stages.map((s) => [s.type, s]));
  return {
    stages: fallback.stages.map(
      (defaultStage) => saved.get(defaultStage.type) ?? defaultStage,
    ),
  };
}

function stageOrder(t: RecruitmentStageType): number {
  return RECRUITMENT_STAGE_TYPES.indexOf(t);
}

/** Enabled stage types in pipeline order. */
export function enabledStages(flow: RequisitionFlow): RecruitmentStageType[] {
  return flow.stages
    .filter((s) => s.enabled)
    .map((s) => s.type)
    .sort((a, b) => stageOrder(a) - stageOrder(b));
}

export function getStageConfig(
  flow: RequisitionFlow,
  type: RecruitmentStageType,
): FlowStage | undefined {
  return flow.stages.find((s) => s.type === type);
}

/** The next enabled stage after `type`, or null if `type` is terminal. */
export function nextEnabledStage(
  flow: RequisitionFlow,
  type: RecruitmentStageType,
): RecruitmentStageType | null {
  const order = enabledStages(flow);
  const i = order.indexOf(type);
  return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
}

/** The previous enabled stage before `type`, or null if `type` is the entry. */
export function prevEnabledStage(
  flow: RequisitionFlow,
  type: RecruitmentStageType,
): RecruitmentStageType | null {
  const order = enabledStages(flow);
  const i = order.indexOf(type);
  return i > 0 ? order[i - 1] : null;
}

// ── Synthesized applicant answers (no real intake exists) ────────────────────

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fieldChoices(field: ApplicationFormField): string[] {
  return field.constraints?.allowedValues?.length
    ? field.constraints.allowedValues
    : (field.options ?? []);
}

/**
 * A deterministic demo answer a candidate "gave" for a field, so criteria/quiz
 * gates and the applicant filter behave consistently without a real application
 * intake.
 */
export function synthResponse(
  candidate: Candidate,
  field: ApplicationFormField,
): string | null {
  const h = hash(candidate.id + field.id);
  const choices = fieldChoices(field);
  if (choices.length) return choices[h % choices.length];
  if (field.type === "yes_no") return h % 2 === 0 ? "Yes" : "No";
  if (field.type === "number") {
    const min = field.constraints?.min ?? 0;
    const max = field.constraints?.max ?? min + 10;
    const span = Math.max(1, max - min + 1);
    return String(min + (h % span));
  }
  return null;
}

// ── Gate evaluation ──────────────────────────────────────────────────────────

function compare(resp: string | null, op: string, value: string): boolean {
  if (resp == null) return false;
  const a = resp.trim().toLowerCase();
  const b = value.trim().toLowerCase();
  switch (op) {
    case "eq":
      return a === b;
    case "neq":
      return a !== b;
    case "includes":
      return a.includes(b);
    case "gte":
      return Number(resp) >= Number(value);
    case "lte":
      return Number(resp) <= Number(value);
    default:
      return false;
  }
}

/** Does a candidate satisfy a criteria gate against the requisition's form? */
export function evaluateCriteria(
  candidate: Candidate,
  gate: CriteriaGate,
  form: ApplicationFormField[],
): boolean {
  if (gate.conditions.length === 0) return true;
  const byId = new Map(form.map((f) => [f.id, f]));
  const results = gate.conditions.map((c) => {
    const field = byId.get(c.fieldId);
    if (!field) return false;
    return compare(synthResponse(candidate, field), c.operator, c.value);
  });
  return gate.match === "all"
    ? results.every(Boolean)
    : results.some(Boolean);
}

/**
 * Does a candidate satisfy a named filter constraint? Same deterministic logic
 * as `evaluateCriteria`, keyed off the constraint's `{match, conditions}`. Used
 * by the stage-tab Filter dropdowns.
 */
export function matchesConstraint(
  candidate: Candidate,
  constraint: FilterConstraint,
  form: ApplicationFormField[],
): boolean {
  if (constraint.conditions.length === 0) return true;
  const byId = new Map(form.map((f) => [f.id, f]));
  const results = constraint.conditions.map((c) => {
    const field = byId.get(c.fieldId);
    if (!field) return false;
    return compare(synthResponse(candidate, field), c.operator, c.value);
  });
  return constraint.match === "all"
    ? results.every(Boolean)
    : results.some(Boolean);
}

/** Grade a candidate's quiz deterministically. */
export function gradeQuiz(
  candidate: Candidate,
  gate: QuizGate,
): { score: number; total: number; passed: boolean } {
  let score = 0;
  let total = 0;
  for (const q of gate.questions) {
    total += q.points;
    const resp = synthResponse(candidate, q.field);
    const correct =
      resp != null &&
      q.correctAnswers.some(
        (ans) => ans.trim().toLowerCase() === resp.trim().toLowerCase(),
      );
    if (correct) score += q.points;
  }
  return { score, total, passed: score >= gate.passThreshold };
}
