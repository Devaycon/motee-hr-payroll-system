"use client";

import { useState } from "react";
import { NetworkIcon } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { OverviewCards } from "./components/overview-cards";
import { HeadcountSection } from "./components/headcount-section";
import { TurnoverSection } from "./components/turnover-section";
import { HiringSection } from "./components/hiring-section";
import { SkillsGapSection } from "./components/skills-gap-section";
import { DemographicsSection } from "./components/demographics-section";
import { SKILLS_GAPS, buildTurnoverTrends } from "./data";
import { NotIntegrated } from "@/src/components/shared/not-integrated";
import {
  useAttritionRisks,
  useHiringMetrics,
  useTurnoverRecords,
  useWorkforceOverview,
} from "./hooks";

const CURRENT_PERIOD = "Q1 2026";

export function WorkforcePage() {
  const { data: overview } = useWorkforceOverview();
  const totalHeadcount = overview?.totalHeadcount ?? 0;
  const avgTenureYears = overview?.avgTenureYears ?? 0;
  const hiringMetrics = useHiringMetrics();
  const attritionRisks = useAttritionRisks();
  const trends = buildTurnoverTrends(useTurnoverRecords());
  const currentTrend = trends.find((t) => t.period === CURRENT_PERIOD);
  const currentTurnoverRate =
    overview?.turnoverRatePercent ?? currentTrend?.rate ?? 0;
  const criticalSkills = SKILLS_GAPS.filter(
    (s) => s.severity === "critical",
  ).length;
  // Controlled so the overview cards can open the section behind each number.
  const [activeTab, setActiveTab] = useState("headcount");

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
        totalHeadcount={totalHeadcount}
        hiringMetrics={hiringMetrics}
        currentTurnoverRate={currentTurnoverRate}
        attritionRisks={attritionRisks}
        avgTenureYears={avgTenureYears}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "headcount", label: "Headcount Plan" },
            { value: "turnover", label: "Turnover Analytics" },
            { value: "hiring", label: "Hiring Velocity" },
            {
              value: "skills",
              label:
                criticalSkills > 0
                  ? `Skills Gap (${criticalSkills})`
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
          {/* Skills inventory is not on the API yet. */}
          <NotIntegrated label="Skills gap">
            <SkillsGapSection />
          </NotIntegrated>
        </TabsContent>

        <TabsContent value="demographics" className="mt-5">
          <DemographicsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
