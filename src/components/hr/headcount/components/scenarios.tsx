"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  FlaskConical,
  Plus,
  Trash2,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
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
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  createScenario,
  deleteScenario,
  duplicateScenario,
  setAdjustment,
} from "@/src/lib/stores/scenarios-slice";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { cn } from "@/src/lib/utils";
import {
  defaultAdjustment,
  projectScenario,
} from "@/src/lib/types/headcount-scenarios";
import type { HeadcountPlan, PlanPeriod } from "../types";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";
import type { ScenarioProjectionRow } from "@/src/lib/types/headcount-scenarios";

/** Mirrors the columns on screen, so an export reads the same as the table. */
const SCENARIO_EXPORT_COLUMNS: ReportColumn<ScenarioProjectionRow>[] = [
  { key: "department", header: "Department", value: (r) => r.department },
  { key: "baselineActual", header: "Actual", value: (r) => r.baselineActual },
  { key: "baselineTarget", header: "Target", value: (r) => r.baselineTarget },
  {
    key: "headcountChange",
    header: "Headcount change",
    value: (r) => r.projectedHeadcount - r.baselineActual,
  },
  {
    key: "expectedLeavers",
    header: "Expected leavers",
    value: (r) => r.expectedLeavers,
  },
  {
    key: "projectedHeadcount",
    header: "Projected",
    value: (r) => r.projectedHeadcount,
  },
  {
    key: "hiresRequired",
    header: "Hires needed",
    value: (r) => r.hiresRequired,
  },
  {
    key: "projectedCost",
    header: "Cost",
    value: (r) => r.projectedCost,
    money: true,
  },
];

interface ScenariosProps {
  plans: HeadcountPlan[];
  activePeriod: PlanPeriod;
}

/**
 * §6.8 — forecasting / what-if modelling.
 *
 * Everything here is an overlay. The baseline column is always shown next to
 * the projection so it stays obvious which numbers are real and which are
 * being imagined.
 */
export function Scenarios({ plans, activePeriod }: ScenariosProps) {
  const dispatch = useAppDispatch();
  const { format } = useCurrency();
  const scenarios = useAppSelector((s) => s.scenarios.scenarios);
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "You";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const departments = useMemo(
    () =>
      [
        ...new Set(
          plans.filter((p) => p.period === activePeriod).map((p) => p.department),
        ),
      ].sort(),
    [plans, activePeriod],
  );

  const selected =
    scenarios.find((s) => s.id === selectedId) ?? scenarios[0] ?? null;

  const projection = useMemo(
    () => (selected ? projectScenario(selected, plans) : null),
    [selected, plans],
  );

  function handleCreate() {
    const name = newName.trim();
    if (!name) {
      toast.error("Give the scenario a name.");
      return;
    }
    dispatch(
      createScenario({
        name,
        basePeriod: activePeriod,
        adjustments: departments.map(defaultAdjustment),
        createdBy: actorName,
      }),
    );
    setNewName("");
    toast.success(`Scenario "${name}" created`, {
      description: `Modelled against ${activePeriod}. The live plan is untouched.`,
    });
  }

  const stats = useMemo<HrStatCardItem[]>(() => {
    if (!projection) return [];
    return [
      {
        icon: FlaskConical,
        label: "Baseline Headcount",
        value: projection.totalBaseline,
        sub: `Actual for ${selected?.basePeriod ?? activePeriod}`,
        tone: "violet",
      },
      {
        icon: TrendingUp,
        label: "Projected Headcount",
        value: projection.totalProjected,
        sub:
          projection.netChange === 0
            ? "No net change"
            : `${projection.netChange > 0 ? "+" : "−"}${Math.abs(projection.netChange)} against baseline`,
        tone: projection.netChange >= 0 ? "emerald" : "amber",
        trend: `${projection.netChange > 0 ? "+" : ""}${projection.netChange}`,
        up: projection.netChange >= 0,
      },
      {
        icon: UserPlus,
        label: "Hires Required",
        value: projection.totalHiresRequired,
        sub: "Growth plus attrition replacement",
        tone: "blue",
      },
      {
        icon: Wallet,
        label: "Projected Cost",
        value: format(projection.totalCost, { compact: true }),
        sub: "Annualised cost of those hires",
        tone: "amber",
      },
    ];
  }, [projection, selected, activePeriod, format]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">New scenario</Label>
          <div className="flex gap-2">
            <Input
              className="h-9 w-64"
              placeholder="e.g. Aggressive growth FY27"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button className="h-9 gap-1.5" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </div>
        </div>

        {scenarios.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs">Viewing</Label>
            <Select
              value={selected?.id ?? ""}
              onValueChange={(v) => setSelectedId(v)}
            >
              <SelectTrigger className="h-9 w-64">
                <SelectValue placeholder="Select a scenario" />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.basePeriod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selected && (
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={() => dispatch(duplicateScenario(selected.id))}
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs text-destructive"
              onClick={() => {
                dispatch(deleteScenario(selected.id));
                setSelectedId(null);
                toast.success("Scenario deleted");
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {!selected || !projection ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <FlaskConical className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No scenarios yet</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground/70">
            Model a change in headcount without touching the live plan — growth,
            a hiring freeze, or a higher attrition assumption.
          </p>
        </div>
      ) : (
        <>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex flex-wrap items-center gap-2 p-3">
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/30 text-[10px] text-amber-700 dark:text-amber-400"
              >
                <FlaskConical className="h-2.5 w-2.5" />
                Scenario
              </Badge>
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {selected.name}
                </span>{" "}
                models {selected.basePeriod}. These figures are projections — the
                Headcount Plan tab is unchanged.
              </span>
            </CardContent>
          </Card>

          <HrStatCardsGrid stats={stats} columns={4} />

          <div className="flex justify-end">
            <ExportMenu
              name={`scenario-${selected.name.toLowerCase().replace(/\s+/g, "-")}`}
              title={`Scenario — ${selected.name}`}
              columns={SCENARIO_EXPORT_COLUMNS}
              rows={projection?.rows ?? []}
              variant="outline"
              buttonClassName="h-8 text-xs"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Department</th>
                    <th className="px-3 py-2 text-right font-medium">Actual</th>
                    <th className="px-3 py-2 text-right font-medium">Target</th>
                    <th className="px-3 py-2 text-center font-medium">
                      Headcount change
                    </th>
                    <th className="px-3 py-2 text-center font-medium">
                      Attrition %
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Projected
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Hires needed
                    </th>
                    <th className="px-3 py-2 text-right font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.rows.map((row) => {
                    const adjustment =
                      selected.adjustments.find(
                        (a) => a.department === row.department,
                      ) ?? defaultAdjustment(row.department);
                    return (
                      <tr
                        key={row.department}
                        className="border-b border-border/30 last:border-0"
                      >
                        <td className="px-3 py-2 font-medium text-foreground">
                          {row.department}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {row.baselineActual}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {row.baselineTarget}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            className="mx-auto h-7 w-20 text-center text-xs"
                            value={adjustment.headcountChange}
                            onChange={(e) =>
                              dispatch(
                                setAdjustment({
                                  scenarioId: selected.id,
                                  adjustment: {
                                    ...adjustment,
                                    headcountChange:
                                      Number(e.target.value) || 0,
                                  },
                                }),
                              )
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="mx-auto h-7 w-20 text-center text-xs"
                            value={adjustment.attritionRate}
                            onChange={(e) =>
                              dispatch(
                                setAdjustment({
                                  scenarioId: selected.id,
                                  adjustment: {
                                    ...adjustment,
                                    attritionRate: Number(e.target.value) || 0,
                                  },
                                }),
                              )
                            }
                          />
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-medium",
                            row.projectedHeadcount > row.baselineActual
                              ? "text-emerald-600 dark:text-emerald-400"
                              : row.projectedHeadcount < row.baselineActual
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-foreground",
                          )}
                        >
                          {row.projectedHeadcount}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {row.hiresRequired}
                          {row.expectedLeavers > 0 && (
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              ({row.expectedLeavers} repl.)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {row.projectedCost > 0
                            ? format(row.projectedCost, { compact: true })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            &ldquo;Hires needed&rdquo; includes replacing expected leavers, so a
            department can need hiring even with no growth. Cost falls back to
            the department&apos;s current average salary when no cost-per-hire
            is set.
          </p>
        </>
      )}
    </div>
  );
}
