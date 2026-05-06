export {
  ANNOUNCEMENTS,
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_STYLES,
  ANNOUNCEMENT_TYPE_BORDER,
  AUDIENCE_LABELS,
} from "@/src/data/announcements-demo";

export type { Announcement, AnnouncementType } from "@/src/lib/types/announcements";

export const MY_EMPLOYEE_ID = "emp-current";
export const MY_DEPT = "Engineering";

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
