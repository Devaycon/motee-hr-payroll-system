"use client";

import { Badge } from "@/src/components/ui/badge";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type { Project } from "@/src/lib/types/projects";
import type { LocaleEmployee } from "@/src/lib/types/locale";

interface TeamNode {
  id: string;
  name: string;
  initials: string;
  role: string;
  dept: string;
  reportsTo: string | null;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function LeadCard({ node }: { node: TeamNode }) {
  return (
    <div className="flex min-w-40 max-w-48 flex-col items-center gap-2.5 rounded-2xl bg-primary p-5 text-center text-primary-foreground shadow-lg shadow-primary/25">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/20 text-2xl font-bold tracking-wide ring-2 ring-primary-foreground/30">
        {node.initials}
      </div>
      <div className="w-full">
        <p className="truncate text-sm font-bold leading-tight">{node.name}</p>
        <p className="mt-0.5 truncate text-xs text-primary-foreground/70">
          {node.role}
        </p>
      </div>
      {node.dept && (
        <Badge
          variant="outline"
          className="border-primary-foreground/30 px-1.5 py-0 text-[9px] text-primary-foreground/80"
        >
          {node.dept}
        </Badge>
      )}
    </div>
  );
}

function ManagerNodeCard({ node }: { node: TeamNode }) {
  return (
    <div className="flex min-w-36 max-w-44 flex-col items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent p-3.5 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sidebar-primary/15 text-sm font-bold text-sidebar-primary ring-2 ring-sidebar-primary/25">
        {node.initials}
      </div>
      <div className="w-full">
        <p className="truncate text-xs font-semibold leading-tight text-foreground">
          {node.name}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {node.role}
        </p>
      </div>
      {node.dept && (
        <Badge
          variant="outline"
          className="max-w-full truncate border-sidebar-border px-1.5 py-0 text-[9px] text-sidebar-accent-foreground"
        >
          {node.dept}
        </Badge>
      )}
    </div>
  );
}

function MemberNodeCard({ node }: { node: TeamNode }) {
  return (
    <div className="flex min-w-32 max-w-38 flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 text-center transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {node.initials}
      </div>
      <div className="w-full">
        <p className="truncate text-[11px] font-semibold leading-tight text-foreground">
          {node.name}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {node.role}
        </p>
      </div>
      {node.dept && (
        <Badge
          variant="outline"
          className="w-full justify-center truncate px-1.5 py-0 text-[9px]"
        >
          {node.dept}
        </Badge>
      )}
    </div>
  );
}

function SiblingRow({ items, all }: { items: TeamNode[]; all: TeamNode[] }) {
  return (
    <div className="flex items-start">
      {items.map((node, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;
        const isOnly = items.length === 1;
        return (
          <div key={node.id} className="flex flex-col items-center px-4">
            <div className="relative h-6 w-full">
              {!isOnly && (
                <div
                  className="absolute top-0 h-px bg-border"
                  style={{ left: isFirst ? "50%" : "0", right: isLast ? "50%" : "0" }}
                />
              )}
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
            </div>
            <OrgBranch node={node} all={all} isRoot={false} />
          </div>
        );
      })}
    </div>
  );
}

function OrgBranch({
  node,
  all,
  isRoot,
}: {
  node: TeamNode;
  all: TeamNode[];
  isRoot: boolean;
}) {
  const children = all.filter((n) => n.reportsTo === node.id);
  const isManager = children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {isRoot ? (
        <LeadCard node={node} />
      ) : isManager ? (
        <ManagerNodeCard node={node} />
      ) : (
        <MemberNodeCard node={node} />
      )}
      {children.length > 0 && (
        <>
          <div className="h-6 w-px shrink-0 bg-border" />
          <SiblingRow items={children} all={all} />
        </>
      )}
    </div>
  );
}

/**
 * Scopes the reporting tree to just the people assigned to this project — a
 * manager only becomes the parent node when they're on the team too;
 * everyone else surfaces as their own lead, so the chart never reaches
 * outside the roster to draw lines to managers who aren't on the project.
 */
function buildTeamNodes(
  project: Project,
  employees: LocaleEmployee[],
): TeamNode[] {
  const teamIds = new Set(project.allocations.map((a) => a.employeeId));
  return project.allocations.map((a) => {
    const employee = employees.find((e) => e.id === a.employeeId);
    const managerId = employee?.managerId ?? null;
    return {
      id: a.employeeId,
      name: a.employeeName,
      initials: employee?.initials || initialsFromName(a.employeeName),
      role: a.projectRole,
      dept: employee?.departmentName ?? "",
      reportsTo: managerId && teamIds.has(managerId) ? managerId : null,
    };
  });
}

export function TeamOrgChart({ project }: { project: Project }) {
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const nodes = buildTeamNodes(project, employees);
  const roots = nodes.filter((n) => n.reportsTo === null);

  if (nodes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No one assigned yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Assign people above to see how the project team reports.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
      <div className="flex w-max min-w-full items-start justify-center gap-8 px-8 py-8">
        {roots.map((root) => (
          <OrgBranch key={root.id} node={root} all={nodes} isRoot={roots.length === 1} />
        ))}
      </div>
    </div>
  );
}
