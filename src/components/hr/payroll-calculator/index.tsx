"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Calculator, FileSpreadsheet, Globe2, User } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_HREF, PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import type { EmployeeData } from "@/src/lib/payroll-calculator/nigeria-bulk";
import type { SalaryInputs } from "@/src/lib/payroll-calculator/tax-calculations";
import { cn } from "@/src/lib/utils";
import { BulkCalculator } from "./bulk-calculator";
import { DEFAULT_INPUTS, SingleCalculator } from "./single-calculator";

export const PAYROLL_CALCULATOR_MODULE = "time-payroll.payroll-calculator";

/**
 * `/time-payroll/payroll-calculator` — the MOTEE payroll calculator for
 * Nigeria (Nigeria Tax Act 2025), as a dashboard module: one employee at a
 * time, or a whole spreadsheet. Same calculation as the website calculator;
 * nothing here is saved to payroll.
 */
export function PayrollCalculatorPage() {
  const country = useAppSelector((s) => s.locale.country);
  const canView = useCan(PAYROLL_CALCULATOR_MODULE, "view");
  const canPayroll = useCan(PAYROLL_MODULE, "create");
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [inputs, setInputs] = useState<SalaryInputs>(DEFAULT_INPUTS);
  const [label, setLabel] = useState<string | undefined>();

  if (!canView) return <p className="py-20 text-center text-sm text-muted-foreground">You don&apos;t have access to the Payroll Calculator.</p>;
  if (country !== "ng") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-14 text-center">
        <Globe2 className="h-7 w-7 text-muted-foreground" />
        <p className="text-base font-semibold">The Payroll Calculator is available for Nigerian tenants</p>
        <p className="max-w-md text-sm text-muted-foreground">It calculates PAYE under the Nigeria Tax Act 2025, pension, NHF, NHIS, NSITF, ITF and group life. Switch the demo to the Nigeria tenant to use it.</p>
      </div>
    );
  }

  const open = (data: EmployeeData, name: string) => {
    const { employeeId: _id, ...rest } = data;
    void _id;
    setInputs(rest);
    setLabel(name);
    setTab("single");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><Calculator className="h-6 w-6 text-primary" /> Payroll Calculator</h1>
          <p className="max-w-2xl text-xs text-muted-foreground">
            Take-home pay, PAYE, statutory deductions and the employer&apos;s full cost for any salary — under the Nigeria Tax Act 2025, with rent, mortgage and life-insurance reliefs and the minimum tax rule. For one employee, or a whole spreadsheet at once.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]">🇳🇬 Nigeria · 2026 rates</Badge>
            <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-[10px] text-sky-800 dark:text-sky-300">Calculator only — nothing is saved to payroll</Badge>
          </div>
        </div>
        {canPayroll && (
          <Link href={`${PAYROLL_HREF}/calculator`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Model a pay change for an existing employee <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="flex w-fit rounded-lg bg-muted p-1 text-sm" role="tablist" aria-label="Calculator mode">
        {([
          { key: "single", label: "Single employee", icon: User },
          { key: "bulk", label: "Bulk (spreadsheet)", icon: FileSpreadsheet },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition", tab === t.key ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Both stay mounted so switching tabs keeps the upload and the figures. */}
      <div className={cn(tab !== "single" && "hidden")}>
        <SingleCalculator
          inputs={inputs}
          onChange={(i) => {
            setInputs(i);
            if (JSON.stringify(i) === JSON.stringify(DEFAULT_INPUTS)) setLabel(undefined);
          }}
          label={label}
        />
      </div>
      <div className={cn(tab !== "bulk" && "hidden")}>
        <BulkCalculator onOpen={open} />
      </div>
    </div>
  );
}
