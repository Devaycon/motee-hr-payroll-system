"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, LayoutGrid, RefreshCw, RotateCcw } from "lucide-react";
import { StatCards } from "./components/stat-cards";
import { CustomisableGrid } from "./components/customisable-grid";
import { useLocaleFreshness } from "./hooks";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { loadLocale } from "@/src/lib/stores/locale-slice";
import { resetLayout } from "@/src/lib/stores/dashboard-layout-slice";
import { formatDateTime } from "@/src/lib/utils/format-date";

const HrDashboard = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const country = useAppSelector((s) => s.locale.country);
  const customised = useAppSelector((s) => s.dashboardLayout.customised);
  const { data: freshness } = useLocaleFreshness();
  const [editing, setEditing] = useState(false);

  const greetingName = user?.name?.split(" ")[0] ?? "";

  function finishEditing() {
    setEditing(false);
    toast.success("Dashboard saved", {
      description: "Your layout will be here next time you sign in.",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="py-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          {greetingName ? (
            <h1 className="text-2xl font-bold text-foreground">
              Welcome, {user?.name}!
            </h1>
          ) : (
            <Skeleton className="h-10 w-80" />
          )}
          <p className="w-full text-sm font-semibold text-muted-foreground mt-0.5">
            Here&apos;s an overview of today&apos;s workforce activity and key HR
            metrics.
          </p>
          {/* Says when the figures were taken, so nobody has to guess whether
              they're looking at current information (client feedback). */}
          {freshness && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Last updated {formatDateTime(freshness.generatedAt)}</span>
              <button
                type="button"
                onClick={() => dispatch(loadLocale(country))}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <RefreshCw className="size-3" />
                Refresh
              </button>
            </p>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2">
          {editing && customised && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => dispatch(resetLayout())}
            >
              <RotateCcw className="size-4" />
              Reset to default
            </Button>
          )}
          {editing ? (
            <Button size="sm" className="gap-1.5" onClick={finishEditing}>
              <Check className="size-4" />
              Done
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setEditing(true)}
            >
              <LayoutGrid className="size-4" />
              Customise
            </Button>
          )}
        </div>
      </div>

      <StatCards />

      {editing && (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm text-foreground">
          Drag a widget by its handle to move it, use the arrows to resize, and
          the eye to hide it. Changes save as you make them.
        </p>
      )}

      {/* Self-service widgets ("My Profile Stats") used to sit here. They now
          live only in the employee portal, reachable via the Self-Service
          toggle in the navbar (client feedback §4.3). */}
      <CustomisableGrid editing={editing} />
    </div>
  );
};

export default HrDashboard;
