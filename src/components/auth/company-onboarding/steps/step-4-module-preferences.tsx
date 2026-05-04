"use client";

import { Button } from "@/src/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateEnabledModules, markStepComplete, setCurrentStep } from "@/src/lib/stores/onboarding-slice";
import { AVAILABLE_MODULES } from "@/src/lib/types/onboarding-setup.types";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function Step4ModulePreferences() {
  const dispatch = useAppDispatch();
  const enabledModules = useAppSelector((s) => s.onboarding.companySetup.enabledModules);
  const [selected, setSelected] = useState<string[]>(enabledModules);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelected(AVAILABLE_MODULES.map((m) => m.id));
  const clearAll = () => setSelected([]);

  const onSubmit = () => {
    dispatch(updateEnabledModules(selected));
    dispatch(markStepComplete(4));
    dispatch(setCurrentStep(5));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{selected.length} of {AVAILABLE_MODULES.length} modules selected</span>
        <div className="flex gap-2">
          <button type="button" onClick={selectAll} className="text-xs text-primary hover:underline">Select all</button>
          <span className="text-xs text-muted-foreground">·</span>
          <button type="button" onClick={clearAll} className="text-xs text-muted-foreground hover:underline">Clear</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AVAILABLE_MODULES.map((mod) => {
          const isSelected = selected.includes(mod.id);
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => toggle(mod.id)}
              className={cn(
                "flex items-center justify-between rounded-lg border p-4 text-left transition-all",
                isSelected
                  ? "border-border bg-muted/50"
                  : "border-border hover:bg-muted/30"
              )}
            >
              <span className="text-sm font-medium text-foreground">{mod.label}</span>
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                  isSelected ? "border-transparent text-white" : "border-border"
                )}
                style={isSelected ? { backgroundColor: "#1D9E75" } : {}}
              >
                {isSelected && <Check size={11} strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => dispatch(setCurrentStep(3))}>
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={selected.length === 0}
          style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
