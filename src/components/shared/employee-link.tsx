"use client";

import Link from "next/link";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { cn } from "@/src/lib/utils";

/** The employee profile route. The one place this path is spelled out. */
export function employeeProfileHref(employeeId: string, module?: string): string {
  const base = `/organization/employees/${employeeId}`;
  return module ? `${base}?module=${module}` : base;
}

interface EmployeeLinkProps {
  name: string;
  /** System id. Without it the name renders as plain text rather than a dead link. */
  employeeId?: string | null;
  initials?: string;
  gender?: string | null;
  /** Hide the avatar when the surrounding row already shows one. */
  showAvatar?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
  avatarClassName?: string;
  nameClassName?: string;
}

/**
 * A person's avatar beside their name, linking to their profile when the id is
 * known. The photo is derived from the name, so it still renders for people we
 * only have a display name for (e.g. a change-request approver recorded before
 * ids were captured) — those just aren't clickable.
 */
export function EmployeeLink({
  name,
  employeeId,
  initials,
  gender,
  showAvatar = true,
  size = "sm",
  className,
  avatarClassName,
  nameClassName,
}: EmployeeLinkProps) {
  const label = (
    <span
      className={cn(
        "truncate text-xs font-medium text-foreground",
        employeeId && "hover:text-primary hover:underline",
        nameClassName,
      )}
    >
      {name}
    </span>
  );

  const body = (
    <>
      {showAvatar && (
        <PersonAvatar
          name={name}
          initials={initials}
          gender={gender}
          size={size}
          className={cn("size-6 shrink-0", avatarClassName)}
          fallbackClassName="bg-primary/10 text-primary text-[9px] font-semibold"
        />
      )}
      {label}
    </>
  );

  const wrapperClass = cn("inline-flex min-w-0 items-center gap-1.5", className);

  if (!employeeId) {
    return <span className={wrapperClass}>{body}</span>;
  }

  return (
    <Link
      href={employeeProfileHref(employeeId)}
      className={cn(wrapperClass, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm")}
    >
      {body}
    </Link>
  );
}
