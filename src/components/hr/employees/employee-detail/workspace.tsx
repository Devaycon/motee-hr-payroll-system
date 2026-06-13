"use client";

import { useMemo, useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { requestEdit } from "@/src/lib/stores/profile-edits-slice";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import { personPhotoUrl } from "@/src/lib/utils/avatar";
import type { EmployeeStats } from "@/src/lib/types/employee-detail";
import {
  useVisibleEmployeeModules,
  SELF_PROFILE_MODULE_KEYS,
} from "./registry";
import { ModuleNav } from "./module-nav";
import { ProfileModule } from "./modules";
import { StatStrip, formatDuration } from "./ui";
import { ProfileVariantProvider, type ProfileVariant } from "./variant";

const VARIANTS: Record<"hr" | "self", ProfileVariant> = {
  hr: { mode: "edit", audience: "hr" },
  self: { mode: "request", audience: "employee" },
};

interface EmployeeProfileWorkspaceProps {
  id: string;
  employee: LocaleEmployee;
  stats: EmployeeStats | null;
  variant: "hr" | "self";
}

/**
 * Shared employee "file" layout used by both the HR employee-details page
 * (variant="hr", direct edit) and the self My Profile page (variant="self",
 * change-request flow). The host page supplies its own header above this.
 */
export function EmployeeProfileWorkspace({
  id,
  employee: emp,
  stats,
  variant,
}: EmployeeProfileWorkspaceProps) {
  const dispatch = useAppDispatch();
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modules = useVisibleEmployeeModules();
  const navModules = useMemo(() => {
    const withoutProfile = modules.filter((m) => m.key !== "profile");
    return variant === "self"
      ? withoutProfile.filter((m) => SELF_PROFILE_MODULE_KEYS.has(m.key))
      : withoutProfile;
  }, [modules, variant]);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active = useMemo(
    () => navModules.find((m) => m.key === activeKey) ?? navModules[0],
    [navModules, activeKey],
  );
  const ActiveComponent = active?.Component;

  const photoUrl =
    (emp as { photoUrl?: string }).photoUrl ??
    personPhotoUrl(emp.fullName, (emp as { gender?: string }).gender);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      dispatch(
        requestEdit({
          employeeId: id,
          field: "photoUrl",
          label: "Profile photo",
          currentValue: photoUrl ?? "",
          requestedValue: String(reader.result),
          reason: "Profile photo change",
          requestedBy: actorName,
        }),
      );
      toast.success("Photo change requested — pending approval in My Requests.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <ProfileVariantProvider value={VARIANTS[variant]}>
      <div className="flex flex-col gap-5">
        {/* Top: profile image + the employee's "file" (Profile module) */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 lg:items-stretch">
          <Card className="lg:h-full">
            <CardContent className="px-5 py-6 flex flex-col items-center gap-4 h-full overflow-y-auto">
              <div className="w-full aspect-square overflow-hidden rounded-2xl bg-primary/10 shrink-0">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={emp.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-6xl font-bold text-primary/70">
                      {emp.initials}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground text-center break-words">
                {emp.fullName}
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageUp className="w-4 h-4" />
                Request image change
              </Button>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardContent className="px-5 py-5">
              <ProfileModule employeeId={id} employee={emp} />
            </CardContent>
          </Card>
        </div>

        {/* Stats strip */}
        {stats && (
          <StatStrip
            items={[
              { label: "Leave remaining", value: `${stats.leaveRemaining}days`, accent: "text-emerald-600" },
              { label: "Open tasks", value: stats.openTasks },
              { label: "Pending approvals", value: stats.pendingApprovals },
              { label: "Assets", value: stats.assignedAssets },
              { label: "Kudos", value: stats.kudosReceived },
              { label: "Tenure", value: formatDuration(emp.startDate) },
            ]}
          />
        )}

        {/* Module sidebar + content — fixed, equal height with internal scroll */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 lg:h-[calc(100vh-7rem)]">
          <ModuleNav modules={navModules} active={active?.key ?? ""} onSelect={setActiveKey} />
          <Card className="min-w-0 flex flex-col lg:h-full">
            <CardContent className="px-5 py-5 flex-1 min-h-0 overflow-y-auto [&_[data-slot=tabs-trigger][data-state=active]]:bg-[#ff8b2d]! [&_[data-slot=tabs-trigger][data-state=active]]:text-white! [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none!">
              {ActiveComponent && <ActiveComponent employeeId={id} employee={emp} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProfileVariantProvider>
  );
}
