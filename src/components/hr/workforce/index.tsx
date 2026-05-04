"use client";

import { NetworkIcon } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { OverviewCards } from "./components/overview-cards";
import { HeadcountSection } from "./components/headcount-section";
import { TurnoverSection } from "./components/turnover-section";
import { HiringSection } from "./components/hiring-section";
import { SkillsGapSection } from "./components/skills-gap-section";
import { DemographicsSection } from "./components/demographics-section";
import {
  HIRING_METRICS,
  SKILLS_GAPS,
  buildTurnoverTrends,
  TURNOVER_RECORDS,
} from "./data";
import { ATTRITION_RISKS } from "@/src/components/hr/headcount/data";
import { HEADCOUNT_PLANS } from "@/src/components/hr/headcount/data";

const CURRENT_PERIOD = "Q1 2026";

function computeStats() {
  const currentPlans = HEADCOUNT_PLANS.filter(
    (p) => p.period === CURRENT_PERIOD,
  );
  const totalHeadcount = currentPlans.reduce((s, p) => s + p.actual, 0);

  const trends = buildTurnoverTrends(TURNOVER_RECORDS);
  const currentTrend = trends.find((t) => t.period === CURRENT_PERIOD);
  const currentTurnoverRate = currentTrend?.rate ?? 0;

  const avgTenureYears =
    ATTRITION_RISKS.length > 0
      ? Math.round(
          (ATTRITION_RISKS.reduce((s, r) => s + r.tenureYears, 0) /
            ATTRITION_RISKS.length) *
            10,
        ) / 10
      : 0;

  const criticalSkills = SKILLS_GAPS.filter(
    (s) => s.severity === "critical",
  ).length;

  return {
    totalHeadcount,
    currentTurnoverRate,
    avgTenureYears,
    criticalSkills,
  };
}

const stats = computeStats();

export function WorkforcePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Workforce Planning
          </h1>
          <p className="text-sm text-muted-foreground">
            Headcount targets, turnover analytics, hiring velocity, skills gaps,
            and workforce demographics.
          </p>
        </div>
      </div>

      <OverviewCards
        totalHeadcount={stats.totalHeadcount}
        hiringMetrics={HIRING_METRICS}
        currentTurnoverRate={stats.currentTurnoverRate}
        attritionRisks={ATTRITION_RISKS}
        avgTenureYears={stats.avgTenureYears}
      />

      <Tabs defaultValue="headcount">
        <PageTabsList
          tabs={[
            { value: "headcount", label: "Headcount Plan" },
            { value: "turnover", label: "Turnover Analytics" },
            { value: "hiring", label: "Hiring Velocity" },
            {
              value: "skills",
              label:
                stats.criticalSkills > 0
                  ? `Skills Gap (${stats.criticalSkills})`
                  : "Skills Gap",
            },
            { value: "demographics", label: "Demographics" },
          ]}
        />

        <TabsContent value="headcount" className="mt-5">
          <HeadcountSection />
        </TabsContent>

        <TabsContent value="turnover" className="mt-5">
          <TurnoverSection />
        </TabsContent>

        <TabsContent value="hiring" className="mt-5">
          <HiringSection />
        </TabsContent>

        <TabsContent value="skills" className="mt-5">
          <SkillsGapSection />
        </TabsContent>

        <TabsContent value="demographics" className="mt-5">
          <DemographicsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
