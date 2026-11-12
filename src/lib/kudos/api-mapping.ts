import { getInitials } from "@/src/lib/types/dashboard";
import type {
  CompanyValue,
  KudosLeaderboardEntry,
  KudosPost,
  KudosType,
  NewKudos,
  ReactionType,
} from "@/src/lib/types/kudos";
import type {
  CompanyValue as ApiCompanyValue,
  KudosPostDto,
  KudosRequest,
  KudosStandingDto,
  KudosType as ApiKudosType,
} from "@/src/types/kudos";

/** The screens use snake_case codes; the API spells two of them in camelCase. */
export function kudosTypeFromApi(t: ApiKudosType): KudosType {
  return t === "customerFocus" ? "customer_focus" : t;
}
export function kudosTypeToApi(t: KudosType): ApiKudosType {
  return t === "customer_focus" ? "customerFocus" : t;
}
export function companyValueFromApi(v: ApiCompanyValue): CompanyValue {
  return v === "customerFirst" ? "customer_first" : v;
}
export function companyValueToApi(v: CompanyValue): ApiCompanyValue {
  return v === "customer_first" ? "customerFirst" : v;
}

/** Every reaction the feed draws, in its order, even ones nobody has used. */
const REACTIONS: ReactionType[] = ["heart", "celebrate", "clap", "fire", "star"];

export function kudosPostFromApi(dto: KudosPostDto): KudosPost {
  const toDepartment = dto.recipientKind === "department";
  const recipientName =
    (toDepartment ? dto.recipientDepartmentName : dto.recipientName) ??
    "Unknown";
  const counts = new Map(dto.reactions.map((r) => [r.type, r] as const));
  const types = [
    ...REACTIONS,
    ...dto.reactions.map((r) => r.type).filter((t) => !REACTIONS.includes(t)),
  ];
  return {
    id: dto.id,
    senderName: dto.senderName ?? "Unknown",
    senderInitials: getInitials(dto.senderName ?? "?"),
    senderDept: dto.senderDepartmentName ?? "—",
    recipientName,
    recipientInitials: toDepartment
      ? recipientName.slice(0, 2).toUpperCase()
      : getInitials(recipientName),
    recipientDept: dto.recipientDepartmentName ?? "—",
    recipientType: toDepartment ? "department" : "individual",
    kudosType: kudosTypeFromApi(dto.kudosType),
    customTypeName: dto.customTypeName ?? undefined,
    companyValue: companyValueFromApi(dto.companyValue),
    message: dto.message,
    reactions: types.map((type) => {
      const r = counts.get(type);
      return {
        type,
        count: r?.count ?? 0,
        // The API reports only whether the viewer reacted, not who else did.
        users: r?.mine ? ["You"] : [],
        reactedBy: r?.mine ? ["You"] : [],
      };
    }),
    comments: dto.comments.map((c) => ({
      id: c.id,
      authorName: c.authorName ?? "Unknown",
      authorInitials: getInitials(c.authorName ?? "?"),
      authorDept: c.authorDepartmentName ?? undefined,
      message: c.message,
      createdAt: c.createdAt.slice(0, 10),
    })),
    createdAt: dto.createdAt.slice(0, 10),
    isPublic: dto.visibility !== "private",
    isPrivate: dto.visibility === "private",
    isBroadcast: dto.visibility === "broadcast" || dto.isAnnounced,
    isPinned: dto.isPinned,
  };
}

/** The reaction the viewer has on each post, as the feed tracks it. */
export function myReactionsFrom(
  dtos: KudosPostDto[],
): Record<string, ReactionType | null> {
  return Object.fromEntries(
    dtos.map((d) => [d.id, d.reactions.find((r) => r.mine)?.type ?? null]),
  );
}

export function leaderboardFromApi(
  rows: KudosStandingDto[],
): KudosLeaderboardEntry[] {
  return rows.map((row) => {
    const name = row.employeeName ?? "Unknown";
    const dept = row.departmentName ?? "—";
    return {
      id: row.standing.employeeId,
      name,
      initials: getInitials(name),
      department: dept,
      employeeName: name,
      employeeInitials: getInitials(name),
      rank: row.standing.rank,
      kudosReceived: row.standing.received,
      kudosSent: row.standing.sent,
      streak: row.standing.streak,
      dept,
    };
  });
}

export function kudosToApi(
  form: NewKudos,
  ids: { employeeId?: string | null; departmentId?: string | null },
): KudosRequest {
  return {
    recipientEmployeeId:
      form.recipientType === "individual" || !form.recipientType
        ? (ids.employeeId ?? null)
        : null,
    recipientDepartmentId:
      form.recipientType === "department" || form.recipientType === "team"
        ? (ids.departmentId ?? null)
        : null,
    kudosType: kudosTypeToApi(form.kudosType),
    customTypeName:
      form.kudosType === "custom" ? form.customTypeName?.trim() || null : null,
    companyValue: companyValueToApi(form.companyValue),
    message: form.message.trim(),
    visibility: form.isBroadcast
      ? "broadcast"
      : form.isPrivate
        ? "private"
        : "public",
  };
}
