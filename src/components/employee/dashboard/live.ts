"use client";

/**
 * The self-service dashboard's cards from the API (signed in): your leave
 * balances, the kudos you have received, what is coming up on the calendar,
 * your reminders, your announcement feed and your tasks. Each list is
 * undefined signed out, so the cards keep their demo content.
 */
import { useMemo } from "react";
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { useMyLeave } from "@/src/lib/leave/use-my-leave";
import { toAnnouncement } from "@/src/lib/announcements/api-mapping";
import { initials } from "@/src/lib/helpdesk/api-mapping";
import { taskFromApi } from "@/src/components/employee/tasks/hooks";
import { useGetAnnouncementFeedQuery } from "@/src/store/services/announcements";
import { useGetUpcomingCalendarQuery } from "@/src/store/services/calendar";
import { useGetMyKudosQuery } from "@/src/store/services/kudos";
import { useGetMyRemindersQuery } from "@/src/store/services/my-reminders";
import { useGetAllTasksQuery } from "@/src/store/services/collections";
import type {
  EMPLOYEE_LEAVE_BALANCES,
  EMPLOYEE_PENDING_ITEMS,
  EMPLOYEE_RECENT_KUDOS,
  EMPLOYEE_TASKS,
  EMPLOYEE_UPCOMING_EVENTS,
} from "@/src/data/employee-dashboard-demo";
import type { ANNOUNCEMENTS } from "@/src/data/announcements-demo";

const LEAVE_COLOURS: Record<string, [string, string]> = {
  annual: ["text-blue-600", "bg-blue-500/10"],
  sick: ["text-rose-600", "bg-rose-500/10"],
  maternity: ["text-pink-600", "bg-pink-500/10"],
  paternity: ["text-indigo-600", "bg-indigo-500/10"],
  compassionate: ["text-amber-600", "bg-amber-500/10"],
  study: ["text-emerald-600", "bg-emerald-500/10"],
  unpaid: ["text-slate-600", "bg-slate-500/10"],
  religious: ["text-violet-600", "bg-violet-500/10"],
};

const KUDOS_EMOJI: Record<string, string> = {
  integrity: "🤝",
  innovation: "💡",
  collaboration: "🙌",
  excellence: "🏆",
  customerFirst: "⭐",
};

const titleCase = (s: string) =>
  s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();

function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function eventIcon(category: string): [LucideIcon, string] {
  if (/birthday/i.test(category)) return [Star, "birthday"];
  if (/anniversary/i.test(category)) return [Award, "anniversary"];
  if (/training|learning|course/i.test(category)) return [BookOpen, "training"];
  if (/review|performance/i.test(category)) return [TrendingUp, "performance"];
  if (/leave|sickness|holiday/i.test(category)) return [CalendarDays, "leave"];
  return [CalendarDays, "company"];
}

export function useLiveEmployeeDashboard() {
  const live = useIsLive();
  const leave = useMyLeave();
  const kudos = useGetMyKudosQuery(undefined, { skip: !live });
  const upcoming = useGetUpcomingCalendarQuery({ days: 30 }, { skip: !live });
  const reminders = useGetMyRemindersQuery(undefined, { skip: !live });
  const feed = useGetAnnouncementFeedQuery(undefined, { skip: !live });
  const tasks = useGetAllTasksQuery(undefined, { skip: !live });

  return useMemo(() => {
    if (!live) return { live };
    const leaveBalances: typeof EMPLOYEE_LEAVE_BALANCES | undefined = leave.balances?.map((b) => {
      const [color, bgColor] = LEAVE_COLOURS[b.type] ?? LEAVE_COLOURS.annual!;
      return {
        id: b.type,
        type: titleCase(b.type),
        total: b.totalEntitlement,
        used: b.daysUsed,
        pending: b.daysPending,
        color,
        bgColor,
      };
    });
    const recentKudos: typeof EMPLOYEE_RECENT_KUDOS | undefined = kudos.data?.data?.received
      .slice(0, 5)
      .map((k) => ({
        id: k.id,
        senderName: k.senderName ?? "A colleague",
        senderInitials: initials(k.senderName),
        kudosType: titleCase(k.companyValue),
        emoji: KUDOS_EMOJI[k.companyValue] ?? "🎉",
        message: k.message,
        time: ago(k.createdAt),
      }));
    const upcomingEvents: typeof EMPLOYEE_UPCOMING_EVENTS | undefined = upcoming.data?.data?.map((e, i) => {
      const [icon, type] = eventIcon(String(e.category));
      const iso = e.date.slice(0, 10);
      return {
        id: i + 1,
        icon,
        label: e.personName && !e.title.includes(e.personName) ? `${e.title} — ${e.personName}` : e.title,
        date: new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        isoDate: iso,
        type,
      };
    });
    const pendingItems: typeof EMPLOYEE_PENDING_ITEMS | undefined = reminders.data?.data?.map((r) => ({
      id: r.id,
      icon: Bell,
      label: r.reminderIsDue ? "Reminder due" : "Reminder",
      sub: r.body,
      link: "/employee/tasks",
      urgent: r.reminderIsDue,
    }));
    const announcements = feed.data?.data?.map(toAnnouncement) as unknown as typeof ANNOUNCEMENTS | undefined;
    const myTasks: typeof EMPLOYEE_TASKS | undefined = tasks.data?.map((t) => ({
      ...taskFromApi(t),
      link: "/employee/tasks",
    }));
    return { live, leaveBalances, recentKudos, upcomingEvents, pendingItems, announcements, myTasks };
  }, [live, leave.balances, kudos.data, upcoming.data, reminders.data, feed.data, tasks.data]);
}
