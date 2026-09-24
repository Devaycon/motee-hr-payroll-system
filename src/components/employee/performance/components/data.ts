import type { GoalCategory, SelfAssessment } from "@/src/lib/types/performance";

export const CATEGORY_OPTIONS: GoalCategory[] = [
  "technical",
  "leadership",
  "communication",
  "growth",
  "operational",
];

export const EMPTY_SELF_ASSESSMENT: SelfAssessment = {
  achievements: "",
  challenges: "",
  developmentAreas: "",
  managerFeedback: "",
};
