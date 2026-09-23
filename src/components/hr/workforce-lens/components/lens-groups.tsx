"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PersonPhoto } from "@/src/components/shared/person-photo";
import { employeeProfileHref } from "@/src/components/shared/employee-link";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/src/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { paletteColor } from "@/src/lib/reports/charts";
import type { LensGroup, LensMember } from "@/src/lib/workforce-lens/group";

/** Avatars drawn per card before the rest collapse into a "+N" bubble. */
const MAX_AVATARS = 14;

function MemberAvatar({ member, color }: { member: LensMember; color: string }) {
  return (
    <HoverCard openDelay={120} closeDelay={60}>
      <HoverCardTrigger asChild>
        <Link
          href={employeeProfileHref(member.id)}
          aria-label={member.name}
          className="block size-9 rounded-full outline-none transition-transform hover:z-10 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
          // The card's colour, as an outline that doesn't shift the layout.
          style={{ boxShadow: `0 0 0 2px var(--card), 0 0 0 4px ${color}` }}
        >
          <PersonPhoto
            name={member.name}
            gender={member.gender}
            initials={member.initials}
            className="size-full rounded-full text-[10px]"
          />
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-60" side="top">
        <div className="flex items-center gap-3">
          <PersonPhoto
            name={member.name}
            gender={member.gender}
            initials={member.initials}
            className="size-10 rounded-full text-xs"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{member.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {member.jobTitle}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {member.department}
          {member.branchName ? ` · ${member.branchName}` : ""}
        </p>
        {member.skills && member.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {member.skills.slice(0, 4).map((s) => (
              <span
                key={s}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <Link
          href={employeeProfileHref(member.id)}
          className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        >
          View profile
        </Link>
      </HoverCardContent>
    </HoverCard>
  );
}

/** "+N" for a card with more people than fit; opens the full list. */
function OverflowBubble({
  group,
  hidden,
  color,
}: {
  group: LensGroup;
  hidden: number;
  color: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Show all ${group.count} in ${group.label}`}
          className="flex size-9 items-center justify-center rounded-full text-[11px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ backgroundColor: color }}
        >
          +{hidden}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" side="bottom" align="start">
        <p className="px-2 py-1 text-xs font-semibold">
          {group.label} · {group.count}
        </p>
        <ul className="max-h-72 overflow-y-auto">
          {group.members.map((m) => (
            <li key={m.id}>
              <Link
                href={employeeProfileHref(m.id)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
              >
                <PersonPhoto
                  name={m.name}
                  gender={m.gender}
                  initials={m.initials}
                  className="size-6 shrink-0 rounded-full text-[9px]"
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">
                    {m.name}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {m.jobTitle}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function GroupCard({ group, index }: { group: LensGroup; index: number }) {
  const color = paletteColor(index);
  const shown = group.members.slice(0, MAX_AVATARS);
  const hidden = group.count - shown.length;

  return (
    <article
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold" title={group.label}>
            {group.label}
          </h3>
          <p className="text-xs text-muted-foreground">
            {group.pct}% of {group.aggregateOnly ? "those who answered" : "people"}
          </p>
        </div>
        <span className="text-2xl font-bold leading-none tabular-nums">
          {group.count}
        </span>
      </header>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="presentation"
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, group.pct)}%`, backgroundColor: color }}
        />
      </div>

      {group.aggregateOnly ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0" />
          Totals only, no names shown
        </p>
      ) : (
        <div className="flex flex-wrap gap-2.5 px-1 pb-1">
          {shown.map((m) => (
            <MemberAvatar key={m.id} member={m} color={color} />
          ))}
          {hidden > 0 && (
            <OverflowBubble group={group} hidden={hidden} color={color} />
          )}
        </div>
      )}
    </article>
  );
}

/**
 * One card per group, laid out in a responsive grid: the count and share up
 * top, the people below. Wraps to the screen rather than scrolling sideways.
 */
export function LensGroups({ groups }: { groups: LensGroup[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {groups.map((g, i) => (
        <GroupCard key={g.key} group={g} index={i} />
      ))}
    </div>
  );
}
