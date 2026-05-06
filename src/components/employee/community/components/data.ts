export {
  POSTS,
  CELEBRATIONS,
  POST_TYPE_CONFIG,
  POST_TYPE_OPTIONS,
  CELEBRATION_KIND_CONFIG,
  DEPARTMENT_CONFIG,
  computeFeedStats,
} from "@/src/data/community-demo";

export {
  KUDOS_POSTS,
  LEADERBOARD,
  KUDOS_TYPE_CONFIG,
  KUDOS_TYPE_OPTIONS,
  REACTION_ICONS,
  EMPLOYEE_ROSTER,
  COMPANY_VALUE_CONFIG,
} from "@/src/data/kudos-demo";

export {
  SUGGESTIONS,
  SUGGESTION_CATEGORY_CONFIG,
  SUGGESTION_STATUS_CONFIG,
  SUGGESTION_CATEGORY_OPTIONS,
  SUGGESTION_STATUS_OPTIONS,
  computeSuggestionStats,
} from "@/src/data/suggestions-demo";

export const MY_INITIALS = "EN";
export const MY_NAME = "Emeka Nwosu";
export const MY_DEPT = "Engineering";

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
