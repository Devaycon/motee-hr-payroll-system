/**
 * §14 — Go-Live Readiness checklist.
 *
 * Specific to HRIS implementations: a fixed template of checks across five
 * categories, rolling up into one readiness score.
 */
export type GoLiveCategory =
  | "people"
  | "data"
  | "systems"
  | "compliance"
  | "support";

export const GO_LIVE_CATEGORY_LABELS: Record<GoLiveCategory, string> = {
  people: "People",
  data: "Data",
  systems: "Systems",
  compliance: "Compliance",
  support: "Support",
};

export interface GoLiveChecklistItem {
  id: string;
  category: GoLiveCategory;
  label: string;
  done: boolean;
  notes?: string;
}

export interface GoLiveChecklist {
  projectId: string;
  items: GoLiveChecklistItem[];
}

export interface GoLiveReadiness {
  overallPercent: number;
  byCategory: Record<
    GoLiveCategory,
    { done: number; total: number; percent: number }
  >;
}

export function goLiveReadiness(checklist: GoLiveChecklist): GoLiveReadiness {
  const byCategory = {} as GoLiveReadiness["byCategory"];
  for (const cat of Object.keys(GO_LIVE_CATEGORY_LABELS) as GoLiveCategory[]) {
    const items = checklist.items.filter((i) => i.category === cat);
    const done = items.filter((i) => i.done).length;
    byCategory[cat] = {
      done,
      total: items.length,
      percent: items.length ? Math.round((done / items.length) * 100) : 0,
    };
  }
  const done = checklist.items.filter((i) => i.done).length;
  const overallPercent = checklist.items.length
    ? Math.round((done / checklist.items.length) * 100)
    : 0;
  return { overallPercent, byCategory };
}
