/**
 * The 1–5 proficiency scale used by the Skills & Competency framework, and the
 * gap between what someone can do and what their role expects.
 */

export const PROFICIENCY_LABELS: Record<number, string> = {
  1: "Novice",
  2: "Beginner",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

/** Levels arrive as numbers from fixtures and as strings from the record form. */
export function toLevel(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 1;
}

export function proficiencyLabel(v: unknown): string {
  return PROFICIENCY_LABELS[toLevel(v)];
}

export interface SkillLike {
  name: string;
  level: number | string;
  requiredLevel: number | string;
}

/** Levels short of the role's requirement; 0 when met or exceeded. */
export function skillGap(s: SkillLike): number {
  return Math.max(0, toLevel(s.requiredLevel) - toLevel(s.level));
}

export type GapSeverity = "met" | "minor" | "major";

export function gapSeverity(gap: number): GapSeverity {
  if (gap <= 0) return "met";
  return gap === 1 ? "minor" : "major";
}

export const GAP_STYLES: Record<GapSeverity, string> = {
  met: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  minor: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  major: "border-rose-500/30 bg-rose-500/10 text-rose-600",
};

export interface GapSummary {
  assessed: number;
  meetingRequirement: number;
  gaps: number;
  /** Average proficiency, one decimal place. */
  averageLevel: number;
}

export function summariseSkills(skills: SkillLike[]): GapSummary {
  const gaps = skills.filter((s) => skillGap(s) > 0).length;
  const avg = skills.length
    ? skills.reduce((sum, s) => sum + toLevel(s.level), 0) / skills.length
    : 0;
  return {
    assessed: skills.length,
    meetingRequirement: skills.length - gaps,
    gaps,
    averageLevel: Math.round(avg * 10) / 10,
  };
}
