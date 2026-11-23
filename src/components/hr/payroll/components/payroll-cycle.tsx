"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { cn } from "@/src/lib/utils";

export type CycleStep = "predict" | "simulate" | "approve" | "process" | "analyse" | "reconcile";

const STEPS: { key: CycleStep; label: string; hint: string; href: string }[] = [
  { key: "predict", label: "Predict", hint: "Budget & forecast", href: `${PAYROLL_HREF}/budget` },
  { key: "simulate", label: "Simulate", hint: "Model a change", href: `${PAYROLL_HREF}/simulate` },
  { key: "approve", label: "Approve", hint: "Scenario & run approval", href: `${PAYROLL_HREF}/simulate?view=compare` },
  { key: "process", label: "Process", hint: "Run payroll", href: PAYROLL_HREF },
  { key: "analyse", label: "Analyse", hint: "What changed and why", href: `${PAYROLL_HREF}/compare` },
  { key: "reconcile", label: "Reconcile", hint: "Investigate & sign off", href: `${PAYROLL_HREF}/investigations` },
];

/**
 * Predict → Simulate → Approve → Process → Analyse → Reconcile: the payroll
 * control cycle linking budget, simulation, the run and variance intelligence.
 */
export function PayrollCycle({ current }: { current: CycleStep }) {
  return (
    <nav aria-label="Payroll control cycle" className="overflow-x-auto rounded-xl border bg-card px-2 py-1.5">
      <ol className="flex min-w-max items-center">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex items-center">
            <Link
              href={s.href}
              aria-current={s.key === current ? "step" : undefined}
              className={cn("rounded-md px-2.5 py-1 text-xs transition hover:bg-muted", s.key === current ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground")}
            >
              {s.label}
              <span className="ml-1.5 hidden text-[10px] font-normal text-muted-foreground lg:inline">{s.hint}</span>
            </Link>
            {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
