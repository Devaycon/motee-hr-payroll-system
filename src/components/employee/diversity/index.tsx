"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Info, Lock, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Separator } from "@/src/components/ui/separator";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { declare, withdraw } from "@/src/lib/stores/diversity-slice";
import { formatDateTime } from "@/src/lib/utils/format-date";
import {
  SUPPRESSION_THRESHOLD,
  diversityCategories,
  type DiversityFieldKey,
  type Jurisdiction,
} from "@/src/lib/types/diversity";
import { useMyEmployeeRecord } from "@/src/components/employee/profile/hooks";

/**
 * §6.23 — the employee's own diversity declaration.
 *
 * Given its own page rather than a tab inside My Profile. Special-category
 * data should not appear alongside "change my phone number" as though it were
 * the same kind of edit: the explanation of why it is being asked, and the
 * assurance about how it is used, are part of asking properly.
 */
export function MyDiversityPage() {
  const dispatch = useAppDispatch();
  const { data: rec } = useMyEmployeeRecord();
  const country = useAppSelector((s) => s.locale.country);
  const jurisdiction: Jurisdiction = country === "ng" ? "ng" : "uk";

  const employeeId = rec?.id ?? "";
  const existing = useAppSelector((s) =>
    employeeId ? s.diversity.declarations[employeeId] : undefined,
  );

  const categories = useMemo(
    () => diversityCategories(jurisdiction),
    [jurisdiction],
  );

  const [answers, setAnswers] = useState<Partial<Record<DiversityFieldKey, string>>>(
    {},
  );
  const [seededFor, setSeededFor] = useState<string | null>(null);

  // Seed from any existing declaration once the record resolves.
  if (employeeId && employeeId !== seededFor) {
    setSeededFor(employeeId);
    setAnswers(
      existing
        ? Object.fromEntries(
            categories
              .map((c) => [c.key, existing[c.key]] as const)
              .filter(([, v]) => Boolean(v)),
          )
        : {},
    );
  }

  if (!rec) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const answeredCount = categories.filter((c) => answers[c.key]).length;

  function handleSave() {
    dispatch(declare({ employeeId, jurisdiction, answers }));
    toast.success("Your answers have been saved", {
      description: "You can change or withdraw them at any time.",
    });
  }

  function handleWithdraw() {
    dispatch(withdraw(employeeId));
    setAnswers({});
    toast.success("Your answers have been withdrawn", {
      description: "Nothing you previously declared is retained.",
    });
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-2">
        <h1 className="text-4xl font-bold text-foreground">
          Diversity &amp; Inclusion
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Entirely optional, and entirely up to you. Every question can be
          skipped.
        </p>
      </div>

      {/* The assurances belong before the questions, not in a policy nobody
          opens. Someone deciding whether to answer needs them now. */}
      <Card className="border-sky-500/30 bg-sky-500/5">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <p className="text-sm font-semibold text-foreground">
              How this information is used
            </p>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>
              • Reported <strong>only as anonymous totals</strong>. Your
              individual answers are never shown to your manager or to HR.
            </li>
            <li>
              • Groups smaller than {SUPPRESSION_THRESHOLD} people are hidden
              from reports entirely, so nobody can be identified by working
              backwards.
            </li>
            <li>
              • It plays <strong>no part</strong> in pay, promotion, performance
              or any other decision about you.
            </li>
            <li>
              • Only you can set these answers, and you can withdraw them at any
              time.
            </li>
          </ul>
        </CardContent>
      </Card>

      {existing?.declaredAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Last updated {formatDateTime(existing.declaredAt)}
        </div>
      )}

      <Card>
        <CardContent className="space-y-6 p-6">
          {categories.map((category, i) => (
            <div key={category.key} className="space-y-2">
              {i > 0 && <Separator className="mb-6" />}
              <Label className="text-sm font-medium text-foreground">
                {category.label}
              </Label>
              <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                {category.purpose}
              </p>
              <RadioGroup
                className="gap-1.5 pt-1"
                value={answers[category.key] ?? ""}
                onValueChange={(v) =>
                  setAnswers((prev) => ({ ...prev, [category.key]: v }))
                }
              >
                {category.options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                  >
                    <RadioGroupItem value={option} />
                    {option}
                  </label>
                ))}
              </RadioGroup>
              {answers[category.key] && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 text-[11px] text-muted-foreground"
                  onClick={() =>
                    setAnswers((prev) => {
                      const next = { ...prev };
                      delete next[category.key];
                      return next;
                    })
                  }
                >
                  Clear this answer
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleSave} disabled={answeredCount === 0}>
          Save my answers
        </Button>
        {existing && (
          <Button
            variant="outline"
            className="gap-1.5 text-destructive"
            onClick={handleWithdraw}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Withdraw everything
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          {answeredCount} of {categories.length} answered
        </span>
      </div>
    </div>
  );
}
