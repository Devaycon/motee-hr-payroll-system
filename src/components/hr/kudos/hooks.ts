"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  CompanyValue,
  KudosLeaderboardEntry,
  KudosPost,
  KudosType,
} from "@/src/lib/types/kudos";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawKudos {
  id?: string;
  fromEmployeeId?: string;
  toEmployeeId?: string;
  message?: string;
  value?: string;
  type?: string;
  badge?: string;
  visibility?: string;
  reactions?: { type?: string; count?: number }[];
  createdAt?: string;
  publishedAt?: string;
}

function mapKudosType(t?: string): KudosType {
  if (
    t === "teamwork" ||
    t === "innovation" ||
    t === "leadership" ||
    t === "customer_focus" ||
    t === "excellence" ||
    t === "growth"
  )
    return t;
  return "excellence";
}

function mapCompanyValue(v?: string): CompanyValue {
  if (
    v === "integrity" ||
    v === "innovation" ||
    v === "collaboration" ||
    v === "excellence" ||
    v === "customer_first"
  )
    return v;
  return "excellence";
}

interface KudosData {
  posts: KudosPost[];
  leaderboard: KudosLeaderboardEntry[];
}

function buildKudos(bundle: LocaleBundle): KudosData {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const received = new Map<string, number>();
  const sent = new Map<string, number>();

  const posts: KudosPost[] = ((bundle.kudos ?? []) as RawKudos[]).map((raw, i) => {
    const sender = raw.fromEmployeeId ? employeesById.get(raw.fromEmployeeId) : null;
    const recipient = raw.toEmployeeId ? employeesById.get(raw.toEmployeeId) : null;
    if (raw.fromEmployeeId)
      sent.set(raw.fromEmployeeId, (sent.get(raw.fromEmployeeId) ?? 0) + 1);
    if (raw.toEmployeeId)
      received.set(raw.toEmployeeId, (received.get(raw.toEmployeeId) ?? 0) + 1);
    return {
      id: raw.id ?? `KUD-${String(i + 1).padStart(3, "0")}`,
      senderName: sender?.fullName ?? "HR Admin",
      senderInitials: sender?.initials ?? "HA",
      senderDept: sender?.departmentName ?? "HR",
      recipientName: recipient?.fullName ?? "Unknown",
      recipientInitials: recipient?.initials ?? "??",
      recipientDept: recipient?.departmentName ?? "—",
      kudosType: mapKudosType(raw.type ?? raw.badge),
      companyValue: mapCompanyValue(raw.value),
      message: raw.message ?? "",
      reactions: [
        { type: "heart", count: 0, users: [], reactedBy: [] },
        { type: "celebrate", count: 0, users: [], reactedBy: [] },
        { type: "clap", count: 0, users: [], reactedBy: [] },
        { type: "fire", count: 0, users: [], reactedBy: [] },
        { type: "star", count: 0, users: [], reactedBy: [] },
      ],
      comments: [],
      createdAt: raw.publishedAt ?? raw.createdAt ?? bundle.tenant.createdAt.slice(0, 10),
      isPublic: raw.visibility !== "private",
    };
  });

  const leaderboard: KudosLeaderboardEntry[] = bundle.employees
    .map((e) => ({
      id: e.id,
      name: e.fullName,
      initials: e.initials,
      department: e.departmentName,
      employeeName: e.fullName,
      employeeInitials: e.initials,
      rank: 0,
      kudosReceived: received.get(e.id) ?? 0,
      kudosSent: sent.get(e.id) ?? 0,
      streak: 0,
      dept: e.departmentName,
    }))
    .filter((entry) => entry.kudosReceived > 0 || entry.kudosSent > 0)
    .sort((a, b) => b.kudosReceived - a.kudosReceived)
    .slice(0, 10)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return { posts, leaderboard };
}

export function useKudos() {
  return useLocaleSection<KudosData>(buildKudos);
}
