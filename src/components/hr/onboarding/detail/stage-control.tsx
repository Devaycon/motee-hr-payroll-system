"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { onboardingStageFromApi } from "@/src/lib/onboarding/api-mapping";
import type {
  OnboardingRecord,
  OnboardingStage,
} from "@/src/lib/types/onboarding";
import { useGetOnboardingCatalogueQuery } from "@/src/store/services/onboarding";
import type { OnboardingStage as ApiOnboardingStage } from "@/src/types/onboarding";
import { ONBOARDING_STAGE_LABELS } from "../data";
import { useOnboardingActions } from "../hooks";

/** Moves a hire along the onboarding stages, or closes the process out. */
export function StageControl({ record }: { record: OnboardingRecord }) {
  const router = useRouter();
  const { setStage, complete } = useOnboardingActions();
  const { data: catalogue } = useGetOnboardingCatalogueQuery();
  const [stage, setStageChoice] = useState<OnboardingStage>(record.stage);
  const [busy, setBusy] = useState(false);

  // The stages the server offers, in its order.
  const stages = (catalogue?.data?.stages ?? []).map((s) =>
    onboardingStageFromApi(s as ApiOnboardingStage),
  );
  const done = record.status === "completed";

  async function handleMove() {
    setBusy(true);
    await setStage(record.id, stage);
    setBusy(false);
  }

  async function handleComplete() {
    setBusy(true);
    const completed = await complete(record.id);
    setBusy(false);
    if (completed) router.push("/talent/onboarding");
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-end justify-between gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">
            Onboarding stage
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={stage}
              onValueChange={(v) => setStageChoice(v as OnboardingStage)}
              disabled={done || busy}
            >
              <SelectTrigger className="h-8 w-48 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(stages.length ? stages : [record.stage]).map((s) => (
                  <SelectItem key={s} value={s} className="text-sm">
                    {ONBOARDING_STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={done || busy || stage === record.stage}
              onClick={handleMove}
            >
              Move
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs"
          disabled={done || busy}
          onClick={handleComplete}
        >
          {done ? "Onboarding completed" : "Complete onboarding"}
        </Button>
      </CardContent>
    </Card>
  );
}
