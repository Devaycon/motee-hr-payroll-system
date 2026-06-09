"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  CelebrationEntry,
  CelebrationKind,
  CommunityPost,
  DirectoryEmployee,
  PostType,
} from "@/src/lib/types/community";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawPost {
  id?: string;
  type?: string;
  authorId?: string;
  content?: string;
  text?: string;
  body?: string;
  isPinned?: boolean;
  pinned?: boolean;
  createdAt?: string;
  publishedAt?: string;
  likes?: string[];
  comments?: { id?: string; authorId?: string; body?: string; message?: string; createdAt?: string }[];
}

function mapPostType(t?: string): PostType {
  if (t === "shoutout" || t === "event" || t === "poll" || t === "milestone") return t;
  return "update";
}

interface CommunityData {
  posts: CommunityPost[];
  celebrations: CelebrationEntry[];
  directory: DirectoryEmployee[];
}

function getMonthDay(s?: string) {
  if (!s) return null;
  const [, m, d] = s.split("-").map(Number);
  if (!m || !d) return null;
  return { m, d };
}

function buildCommunity(bundle: LocaleBundle): CommunityData {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const community = bundle.community as { posts?: RawPost[] };

  const posts: CommunityPost[] = (community.posts ?? []).map((raw, i) => {
    const author = raw.authorId ? employeesById.get(raw.authorId) : null;
    const id = raw.id ?? `post-${i + 1}`;
    return {
      id,
      type: mapPostType(raw.type),
      authorName: author?.fullName ?? "Employee",
      authorInitials: author?.initials ?? "EM",
      authorDept: author?.departmentName ?? "",
      content: raw.content ?? raw.text ?? raw.body ?? "",
      isPinned: raw.isPinned ?? raw.pinned ?? false,
      likes: raw.likes ?? [],
      comments: (raw.comments ?? []).map((c, j) => {
        const cAuthor = c.authorId ? employeesById.get(c.authorId) : null;
        return {
          id: c.id ?? `${id}-c${j + 1}`,
          authorName: cAuthor?.fullName ?? "Employee",
          authorInitials: cAuthor?.initials ?? "EM",
          authorDept: cAuthor?.departmentName ?? "",
          message: c.body ?? c.message ?? "",
          createdAt: c.createdAt ?? bundle.tenant.createdAt.slice(0, 10),
        };
      }),
      createdAt: raw.publishedAt ?? raw.createdAt ?? bundle.tenant.createdAt.slice(0, 10),
    };
  });

  const today = new Date();
  const within = (mon: number, day: number) => {
    const thisYear = new Date(today.getFullYear(), mon - 1, day);
    const diff =
      (thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= -1 && diff <= 21;
  };

  const celebrations: CelebrationEntry[] = [];
  for (const emp of bundle.employees) {
    const bd = getMonthDay(emp.dateOfBirth);
    if (bd && within(bd.m, bd.d)) {
      celebrations.push({
        id: `bd-${emp.id}`,
        kind: "birthday",
        name: emp.fullName,
        personName: emp.fullName,
        initials: emp.initials,
        personInitials: emp.initials,
        department: emp.departmentName,
        jobTitle: emp.jobTitle,
        date: `${today.getFullYear()}-${String(bd.m).padStart(2, "0")}-${String(bd.d).padStart(2, "0")}`,
        detail: "Birthday",
      });
    }
    const sd = getMonthDay(emp.startDate);
    if (sd && within(sd.m, sd.d)) {
      const years = today.getFullYear() - Number(emp.startDate.slice(0, 4));
      if (years >= 1) {
        celebrations.push({
          id: `anniv-${emp.id}`,
          kind: "anniversary",
          name: emp.fullName,
          personName: emp.fullName,
          initials: emp.initials,
          personInitials: emp.initials,
          department: emp.departmentName,
          jobTitle: emp.jobTitle,
          date: `${today.getFullYear()}-${String(sd.m).padStart(2, "0")}-${String(sd.d).padStart(2, "0")}`,
          detail: `${years} year${years !== 1 ? "s" : ""}`,
        });
      }
    }
  }
  celebrations.sort((a, b) => a.date.localeCompare(b.date));

  const empTypeNameById = new Map(
    bundle.employmentTypes.map((t) => [t.id, t.name]),
  );

  const directory: DirectoryEmployee[] = bundle.employees.map((e) => ({
    id: e.id,
    name: e.fullName,
    initials: e.initials,
    jobTitle: e.jobTitle,
    department: e.departmentName,
    email: e.email,
    location: e.workLocation ?? e.address?.city ?? "—",
    skills: [],
    employmentType: empTypeNameById.get(e.employmentTypeId) ?? "Full-time",
    isOnLeave: e.status === "on_leave",
    startDate: e.startDate,
  }));

  return { posts, celebrations, directory };
}

export function useCommunity() {
  return useLocaleSection<CommunityData>(buildCommunity);
}
