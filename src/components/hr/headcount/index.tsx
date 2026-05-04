"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  HEADCOUNT_PLANS,
  ATTRITION_RISKS,
  DEMOGRAPHICS_EMPLOYMENT_TYPE,
  DEMOGRAPHICS_TENURE,
  DEMOGRAPHICS_DEPARTMENT,
  PLAN_PERIODS,
} from "./data";
import type {
  HeadcountPlan,
  NewHeadcountPlan,
  PlanPeriod,
  GapStatus,
} from "./types";
import { StatCards } from "./components/stat-cards";
import { PlanTable } from "./components/plan-table";
import { GapReport } from "./components/gap-report";
import { AttritionRiskTable } from "./components/attrition-risk";
import { PlanModal } from "./components/plan-modal";
import { Demographics } from "./components/demographics";
import { PageTabsList } from "@/src/components/shared/page-tabs";

function deriveGap(target: number, actual: number): GapStatus {
  if (actual >= target) return actual > target ? "over" : "on_target";
  return "under";
}

export function HeadcountPage() {
  const [plans, setPlans] = useState<HeadcountPlan[]>(HEADCOUNT_PLANS);
  const [activePeriod, setActivePeriod] = useState<PlanPeriod>("Q1 2026");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<HeadcountPlan | null>(null);

  const periodPlans = useMemo(
    () => plans.filter((p) => p.period === activePeriod),
    [plans, activePeriod],
  );

  function handleAdd() {
    setEditingPlan(null);
    setModalOpen(true);
  }

  function handleEdit(plan: HeadcountPlan) {
    setEditingPlan(plan);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    toast.success("Headcount plan removed");
  }

  function handleSave(data: NewHeadcountPlan | HeadcountPlan) {
    if ("id" in data) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === (data as HeadcountPlan).id ? (data as HeadcountPlan) : p,
        ),
      );
      toast.success("Headcount target updated");
    } else {
      const newPlan: HeadcountPlan = {
        ...(data as NewHeadcountPlan),
        id: `hc-${Date.now()}`,
        actual: 0,
        gapStatus: deriveGap((data as NewHeadcountPlan).target, 0),
      };
      setPlans((prev) => [...prev, newPlan]);
      toast.success("Headcount target set");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">
          Headcount Planning
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Set targets, track actuals, and monitor workforce gaps across
          departments.
        </p>
      </div>

      <StatCards plans={periodPlans} attritionRisks={ATTRITION_RISKS} />

      <Tabs defaultValue="plan">
        <PageTabsList
          className="h-11"
          tabs={[
            { value: "plan", label: "Headcount Plan" },
            { value: "gap", label: "Gap Report" },
            { value: "attrition", label: "Attrition Risk" },
            { value: "demographics", label: "Demographics" },
          ]}
        />

        <TabsContent value="plan" className="mt-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <p className="text-sm text-muted-foreground">
              Targets vs actuals for {activePeriod}
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={activePeriod}
                onValueChange={(v) => setActivePeriod(v as PlanPeriod)}
              >
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_PERIODS.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="gap-2" onClick={handleAdd}>
                <Plus className="w-4 h-4" />
                Set Target
              </Button>
            </div>
          </div>
          <PlanTable
            plans={periodPlans}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="gap" className="mt-6">
          <p className="text-xs text-muted-foreground mb-4">
            Departments grouped by headcount status vs target for {activePeriod}
          </p>
          <GapReport plans={periodPlans} />
        </TabsContent>

        <TabsContent value="attrition" className="mt-6">
          <p className="text-xs text-muted-foreground mb-4">
            Employees flagged based on tenure, promotion history, and
            performance trends
          </p>
          <AttritionRiskTable risks={ATTRITION_RISKS} />
        </TabsContent>

        <TabsContent value="demographics" className="mt-6">
          <p className="text-xs text-muted-foreground mb-4">
            Breakdown of current workforce by employment type, tenure, and
            department
          </p>
          <Demographics
            employmentType={DEMOGRAPHICS_EMPLOYMENT_TYPE}
            tenure={DEMOGRAPHICS_TENURE}
            department={DEMOGRAPHICS_DEPARTMENT}
          />
        </TabsContent>
      </Tabs>

      <PlanModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPlan(null);
        }}
        editingPlan={editingPlan}
        activePeriod={activePeriod}
        onSave={handleSave}
      />
    </div>
  );
}
