"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Boxes } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Switch } from "@/src/components/ui/switch";
import type { ModuleSetting } from "../types";

interface Props {
  modules: ModuleSetting[];
}

export function ModuleSettingsPanel({ modules: initial }: Props) {
  const [modules, setModules] = useState<ModuleSetting[]>(initial);

  function update(
    id: string,
    key: "enabled" | "showInSidebar",
    value: boolean,
  ) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        // Disabling a module also hides it from the sidebar.
        if (key === "enabled" && !value) {
          return { ...m, enabled: false, showInSidebar: false };
        }
        return { ...m, [key]: value };
      }),
    );
    const mod = modules.find((m) => m.id === id);
    toast.success(
      `${mod?.name ?? "Module"} ${
        key === "enabled"
          ? value
            ? "enabled"
            : "disabled"
          : value
            ? "shown in sidebar"
            : "hidden from sidebar"
      }.`,
    );
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Boxes className="h-4.5 w-4.5 text-primary" />
          <CardTitle className="text-base">Module Settings</CardTitle>
        </div>
        <CardDescription>
          Enable or disable modules and control their visibility in the sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between px-4 pb-1 text-xs font-medium text-muted-foreground">
          <span>Module</span>
          <div className="flex gap-8">
            <span className="w-16 text-center">Enabled</span>
            <span className="w-16 text-center">Sidebar</span>
          </div>
        </div>
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{mod.name}</p>
              <p className="text-xs text-muted-foreground">{mod.description}</p>
            </div>
            <div className="flex shrink-0 gap-8">
              <div className="flex w-16 justify-center">
                <Switch
                  checked={mod.enabled}
                  onCheckedChange={(v) => update(mod.id, "enabled", v)}
                />
              </div>
              <div className="flex w-16 justify-center">
                <Switch
                  checked={mod.showInSidebar}
                  disabled={!mod.enabled}
                  onCheckedChange={(v) => update(mod.id, "showInSidebar", v)}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
