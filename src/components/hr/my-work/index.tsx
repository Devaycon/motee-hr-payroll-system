"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  Users,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useCurrentUser } from "@/src/lib/auth/demo-identity";
import {
  approveRunTask,
  startTask,
  submitTask,
} from "@/src/lib/stores/workflow-runs-slice";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_STYLES,
} from "@/src/lib/types/workflows";
import { cn } from "@/src/lib/utils";
import { useMyWork, type WorkItem } from "./hooks";

function WorkRow({
  item,
  showOwner,
  onAct,
}: {
  item: WorkItem;
  showOwner?: boolean;
  onAct?: (item: WorkItem) => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border p-3",
        item.overdue && "border-rose-500/40 bg-rose-500/5",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{item.title}</p>
          {item.kind !== "approval" && (
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-[10px] px-1.5 py-0",
                TASK_PRIORITY_STYLES[item.task.priority],
              )}
            >
              {TASK_PRIORITY_LABELS[item.task.priority]}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {item.subtitle}
          {showOwner && item.kind !== "approval" ? ` · ${item.owner}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {item.kind !== "approval" && (
          <span className="text-xs text-muted-foreground tabular-nums">
            due {item.task.dueDate}
          </span>
        )}
        {item.overdue && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-3 w-3" />
            {item.days}d late
          </span>
        )}
        {item.kind === "approval" && item.days > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {item.days}d
          </span>
        )}
        {onAct ? (
          <Button size="sm" className="h-8" onClick={() => onAct(item)}>
            {item.kind === "review" ? "Approve" : "Done"}
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="h-8" asChild>
            <Link href={item.href}>
              Open
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </li>
  );
}

function EmptyState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}

/**
 * One person's work, merged from the two places it lives: approval steps
 * waiting on them, and workflow tasks assigned to or awaiting review by them.
 *
 * The third tab is not padding. An inbox that says "nothing to do" does not
 * answer "who is doing what" - "Adaeze has three, IT has two" does.
 */
export function MyWorkPage({ embedded = false }: { embedded?: boolean } = {}) {
  const dispatch = useAppDispatch();
  const user = useCurrentUser();
  const country = useAppSelector((s) => s.locale.country);
  const { todo, review, others } = useMyWork();
  const [tab, setTab] = useState("todo");

  function complete(item: WorkItem) {
    if (item.kind === "approval") return;
    const ref = {
      country,
      runId: item.run.id,
      taskId: item.task.id,
    };
    const by = user?.name ?? "HR";
    if (item.kind === "review") {
      dispatch(approveRunTask({ ...ref, by }));
      toast.success(`Approved — ${item.task.title}`);
      return;
    }
    if (item.task.status === "not_started") dispatch(startTask(ref));
    dispatch(submitTask({ ...ref, by }));
    toast.success(
      item.task.reviewer
        ? `Sent to ${item.task.reviewerName ?? "review"}`
        : `Completed — ${item.task.title}`,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!embedded && (
        <div>
          <h1 className="text-4xl font-semibold text-foreground">My Work</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Approvals waiting on you and workflow tasks assigned to you, in one
            list — plus what everyone else is holding.
          </p>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <PageTabsList
          tabs={[
            { value: "todo", label: `To do (${todo.length})` },
            { value: "review", label: `Awaiting my review (${review.length})` },
            {
              value: "others",
              label: `Assigned to others (${others.length})`,
              dividerBefore: true,
            },
          ]}
        />

        <TabsContent value="todo" className="mt-4">
          {todo.length === 0 ? (
            <EmptyState
              message="Nothing is waiting on you"
              hint="Check 'Assigned to others' to see who is holding what."
            />
          ) : (
            <ul className="space-y-2">
              {todo.map((item) => (
                <WorkRow
                  key={item.id}
                  item={item}
                  onAct={item.kind === "approval" ? undefined : complete}
                />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="review" className="mt-4">
          {review.length === 0 ? (
            <EmptyState
              message="No tasks awaiting your review"
              hint="Tasks appear here once the person doing them marks them done."
            />
          ) : (
            <ul className="space-y-2">
              {review.map((item) => (
                <WorkRow key={item.id} item={item} onAct={complete} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="others" className="mt-4">
          {others.length === 0 ? (
            <EmptyState
              message="No open workflow tasks anywhere"
              hint="Approve a requisition or hire a candidate to start one."
            />
          ) : (
            <ul className="space-y-2">
              {others.map((item) => (
                <WorkRow key={item.id} item={item} showOwner />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Compact widget for the HR Action Centre landing page. */
export function MyWorkCard() {
  const { todo, review, others } = useMyWork();
  const summary = [
    { icon: Inbox, label: "To do", value: todo.length },
    { icon: CheckCircle2, label: "To review", value: review.length },
    { icon: Users, label: "With others", value: others.length },
  ];
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">My Work</h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
          <Link href="/hr-action-center/tasks">
            Open
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {summary.map((s) => (
          <div key={s.label} className="rounded-md bg-muted/50 p-2">
            <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="mt-1 text-lg font-bold leading-none">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
