"use client";

import { Eye } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { buildAuthUser, setUser } from "@/src/lib/stores/auth-slice";
import { writeDemoRoleId } from "@/src/lib/auth/demo-identity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

/**
 * "View as" - switch the demo persona without logging out.
 *
 * Per-person inboxes are only convincing if you can see a different one. The
 * roles here are the ones that actually own hiring work, so clicking through
 * them shows four genuinely different To-do lists.
 */
const PERSONA_ROLE_IDS = [
  "ROLE-HRADMIN",
  "ROLE-RECRUIT",
  "ROLE-MGR",
  "ROLE-IT",
  "ROLE-FIN",
];

export function PersonaSwitcher() {
  const dispatch = useAppDispatch();
  const bundle = useAppSelector((s) => s.locale.data);
  const roleId = useAppSelector((s) => s.auth.user?.roleId);

  if (!bundle) return null;

  const personas = PERSONA_ROLE_IDS.map((id) =>
    bundle.roles.find((r) => r.id === id),
  ).filter((r): r is NonNullable<typeof r> => Boolean(r));

  if (personas.length === 0) return null;

  function switchTo(nextRoleId: string) {
    if (!bundle) return;
    const next = buildAuthUser(bundle, nextRoleId);
    if (!next) return;
    writeDemoRoleId(nextRoleId);
    dispatch(setUser(next));
  }

  return (
    <Select value={roleId ?? undefined} onValueChange={switchTo}>
      <SelectTrigger className="h-8 w-[168px] gap-1.5 text-xs" aria-label="View as">
        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue placeholder="View as" />
      </SelectTrigger>
      <SelectContent>
        {personas.map((role) => (
          <SelectItem key={role.id} value={role.id} className="text-xs">
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
