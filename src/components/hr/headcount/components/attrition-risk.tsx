"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { EmployeeLink } from "@/src/components/shared/employee-link";
import { cn } from "@/src/lib/utils";
import { RISK_LABELS, RISK_STYLES } from "../data";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";
import type { AttritionRisk, AttritionRiskLevel } from "../types";

interface AttritionRiskTableProps {
  risks: AttritionRisk[];
}

/** Mirrors the columns on screen, so an export reads the same as the table. */
const EXPORT_COLUMNS: ReportColumn<AttritionRisk>[] = [
  { key: "employeeName", header: "Employee", value: (r) => r.employeeName },
  { key: "jobTitle", header: "Job Title", value: (r) => r.jobTitle },
  { key: "department", header: "Department", value: (r) => r.department },
  { key: "tenureYears", header: "Tenure (years)", value: (r) => r.tenureYears },
  {
    key: "riskFactors",
    header: "Risk Factors",
    value: (r) => r.riskFactors.join("; "),
  },
  { key: "riskScore", header: "Score", value: (r) => r.riskScore },
  {
    key: "riskLevel",
    header: "Risk Level",
    value: (r) => RISK_LABELS[r.riskLevel],
  },
  {
    key: "recommendedAction",
    header: "Recommended Action",
    value: (r) => r.recommendedAction,
  },
];

export function AttritionRiskTable({ risks }: AttritionRiskTableProps) {
  // §6.14 — narrow by department or risk band; §6.17 — the band cards filter too.
  const [deptFilter, setDeptFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<AttritionRiskLevel | "all">(
    "all",
  );
  const [managerFilter, setManagerFilter] = useState("all");

  const departments = useMemo(
    () => Array.from(new Set(risks.map((r) => r.department))).sort(),
    [risks],
  );

  const counts = useMemo(
    () => ({
      high: risks.filter((r) => r.riskLevel === "high").length,
      medium: risks.filter((r) => r.riskLevel === "medium").length,
      low: risks.filter((r) => r.riskLevel === "low").length,
    }),
    [risks],
  );

  // §6.14 — managers want their own team, not the whole company.
  const managers = useMemo(
    () =>
      Array.from(
        new Set(risks.map((r) => r.manager).filter((m): m is string => !!m)),
      ).sort(),
    [risks],
  );

  const visible = useMemo(
    () =>
      risks
        .filter((r) => {
          const matchDept = deptFilter === "all" || r.department === deptFilter;
          const matchLevel =
            levelFilter === "all" || r.riskLevel === levelFilter;
          const matchManager =
            managerFilter === "all" || r.manager === managerFilter;
          return matchDept && matchLevel && matchManager;
        })
        // Highest score first — this is a work queue, not a directory.
        .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0)),
    [risks, deptFilter, levelFilter, managerFilter],
  );

  // Clicking the active band clears it, so the cards toggle rather than trap.
  const toggleLevel = (level: AttritionRiskLevel) =>
    setLevelFilter((prev) => (prev === level ? "all" : level));

  const bandCards: HrStatCardItem[] = [
    {
      label: "High Risk",
      value: counts.high,
      sub: "Act now",
      icon: ShieldAlert,
      tone: "red",
      active: levelFilter === "high",
      onClick: () => toggleLevel("high"),
    },
    {
      label: "Medium Risk",
      value: counts.medium,
      sub: "Monitor closely",
      icon: AlertTriangle,
      tone: "amber",
      active: levelFilter === "medium",
      onClick: () => toggleLevel("medium"),
    },
    {
      label: "Low Risk",
      value: counts.low,
      sub: "Standard monitoring",
      icon: ShieldCheck,
      tone: "emerald",
      active: levelFilter === "low",
      onClick: () => toggleLevel("low"),
    },
  ];

  const filtersActive =
    deptFilter !== "all" || levelFilter !== "all" || managerFilter !== "all";

  return (
    <div className="flex flex-col gap-4">
      <HrStatCardsGrid stats={bandCards} columns={3} />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All departments
            </SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d} className="text-xs">
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={levelFilter}
          onValueChange={(v) => setLevelFilter(v as AttritionRiskLevel | "all")}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="All risk levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All risk levels
            </SelectItem>
            {(["high", "medium", "low"] as AttritionRiskLevel[]).map((l) => (
              <SelectItem key={l} value={l} className="text-xs">
                {RISK_LABELS[l]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {managers.length > 0 && (
          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="All managers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All managers
              </SelectItem>
              {managers.map((m) => (
                <SelectItem key={m} value={m} className="text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => {
              setDeptFilter("all");
              setLevelFilter("all");
              setManagerFilter("all");
            }}
          >
            Clear filters
          </Button>
        )}

        <div className="ml-auto">
          <ExportMenu
            name="attrition-risk"
            title="Attrition Risk"
            columns={EXPORT_COLUMNS}
            rows={visible}
            variant="outline"
            buttonClassName="h-8 text-xs"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {filtersActive
                ? "No employees match these filters"
                : "No attrition risks detected"}
            </p>
            <p className="text-xs text-muted-foreground">
              {filtersActive
                ? "Try widening the department or risk level."
                : "All employees appear to be stable based on current indicators."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Employee
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Department
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Tenure
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Risk Factors
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Score
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Risk Level
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                      Recommended Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((risk) => (
                    <tr
                      key={risk.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          {/* §6.16 — the name opens the employee's profile. */}
                          <EmployeeLink
                            name={risk.employeeName}
                            employeeId={risk.employeeId}
                            initials={risk.initials}
                            avatarClassName="h-7 w-7"
                            nameClassName="text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-0.5 pl-7.5">
                            {risk.jobTitle}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {risk.department}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {risk.tenureYears} yr
                          {risk.tenureYears !== 1 ? "s" : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {/* §6.11 — each factor carries its weight, so High vs
                            Medium is explained rather than asserted. */}
                        <div className="flex flex-wrap gap-1">
                          {(risk.factorBreakdown?.length
                            ? risk.factorBreakdown
                            : risk.riskFactors.map((label) => ({
                                label,
                                weight: 0,
                              }))
                          ).map((factor) => (
                            <span
                              key={factor.label}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                              title={
                                factor.weight
                                  ? `Contributes ${factor.weight} points`
                                  : undefined
                              }
                            >
                              {factor.label}
                              {factor.weight > 0 && (
                                <span className="tabular-nums opacity-70">
                                  +{factor.weight}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      {/* §6.12 — the numeric score behind the band. */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-24">
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                risk.riskLevel === "high"
                                  ? "bg-red-500"
                                  : risk.riskLevel === "medium"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500",
                              )}
                              style={{ width: `${risk.riskScore ?? 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground tabular-nums">
                            {risk.riskScore ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            RISK_STYLES[risk.riskLevel],
                          )}
                        >
                          {RISK_LABELS[risk.riskLevel]}
                        </span>
                      </td>
                      {/* §6.13 — turns the list into something actionable. */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-foreground">
                          {risk.recommendedAction ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
