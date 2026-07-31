"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ImageUp, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import { PhotoChangeDialog } from "@/src/components/shared/profile-fields/photo-change-dialog";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { requestEdit, applyEdit } from "@/src/lib/stores/profile-edits-slice";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import { personPhotoUrl } from "@/src/lib/utils/avatar";
import type { EmployeeStats } from "@/src/lib/types/employee-detail";
import { cn } from "@/src/lib/utils";
import { leaveTypeTone } from "@/src/lib/utils/active-leave";
import {
  useVisibleEmployeeModules,
  SELF_PROFILE_MODULE_KEYS,
} from "./registry";
import { useActiveLeave } from "./hooks";
import { ModuleNav } from "./module-nav";
import { ProfileModule } from "./modules";
import { StatStrip } from "./ui";
import { ProfileVariantProvider, type ProfileVariant } from "./variant";
import { ModuleNavigationProvider } from "./module-navigation";

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
 * Each tile opens the module that owns its number — the mapping lives here so
 * a tile can never point somewhere that doesn't explain the figure it shows.
 */
const STAT_TILES: {
  label: string;
  module: string;
  accent?: string;
  value: (s: EmployeeStats) => ReactNode;
  describe: (s: EmployeeStats) => string;
}[] = [
  {
    label: "Available",
    module: "leave",
    accent: "text-emerald-600",
    value: (s) => `${s.leaveRemaining} Leave days`,
    describe: (s) =>
      `${s.leaveRemaining} days of leave available — open the Leave module`,
  },
  {
    label: "Open tasks",
    module: "tasks",
    value: (s) => s.openTasks,
    describe: (s) => `${s.openTasks} open tasks — open the Tasks module`,
  },
  {
    label: "Pending approvals",
    module: "change-log",
    value: (s) => s.pendingApprovals,
    describe: (s) =>
      `${s.pendingApprovals} pending approvals — open the Profile Change Request Log`,
  },
  {
    label: "Assets",
    module: "assets",
    value: (s) => s.assignedAssets,
    describe: (s) =>
      `${s.assignedAssets} assigned assets — open the Assets module`,
  },
  {
    label: "Kudos",
    module: "kudos",
    value: (s) => s.kudosReceived,
    describe: (s) => `${s.kudosReceived} kudos received — open the Kudos module`,
  },
];

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
  const actorId = useAppSelector((s) => s.auth.user?.employeeId);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const moduleSectionRef = useRef<HTMLDivElement>(null);

  // A pending photo request keeps the current picture in place and badges it,
  // rather than swapping the image before HR has approved it (§B3).
  const photoPending = useAppSelector((s) =>
    s.profileEdits.requests.some(
      (r) =>
        r.employeeId === id && r.field === "photoUrl" && r.status === "pending",
    ),
  );

  const { data: activeLeave } = useActiveLeave(id);

  const modules = useVisibleEmployeeModules();
  const navModules = useMemo(() => {
    const withoutProfile = modules.filter((m) => m.key !== "profile");
    return variant === "self"
      ? withoutProfile.filter((m) => SELF_PROFILE_MODULE_KEYS.has(m.key))
      : withoutProfile;
  }, [modules, variant]);

  // `?module=` deep-links a specific module so cards elsewhere in the app can
  // land directly on it (e.g. Location Bookings → ?module=bookings).
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeKey, setActiveKey] = useState<string | null>(() =>
    searchParams.get("module"),
  );
  const active = useMemo(
    () => navModules.find((m) => m.key === activeKey) ?? navModules[0],
    [navModules, activeKey],
  );
  const ActiveComponent = active?.Component;

  /** Selects a module and mirrors it into `?module=` so the view is linkable. */
  const selectModule = (key: string) => {
    setActiveKey(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set("module", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  /** Switch to a module and scroll it into view, if the viewer can see it. */
  const goToModule = (key: string) => {
    if (!navModules.some((m) => m.key === key)) {
      toast.message("That section isn't available for this profile.");
      return;
    }
    selectModule(key);
    moduleSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const photoUrl =
    (emp as { photoUrl?: string }).photoUrl ??
    personPhotoUrl(emp.fullName, (emp as { gender?: string }).gender);

  const handlePhotoSubmit = (dataUrl: string, reason: string) => {
    if (variant === "hr") {
      dispatch(
        applyEdit({ employeeId: id, field: "photoUrl", value: dataUrl }),
      );
      toast.success("Profile photo updated");
      return;
    }
    dispatch(
      requestEdit({
        employeeId: id,
        field: "photoUrl",
        label: "Profile photo",
        currentValue: photoUrl ?? "",
        requestedValue: dataUrl,
        reason,
        requestedBy: actorName,
        requestedById: actorId,
      }),
    );
    toast.success(
      "Photo change requested — it's pending approval in the Profile Change Request Log.",
    );
  };

  return (
    <ProfileVariantProvider value={VARIANTS[variant]}>
      <ModuleNavigationProvider value={goToModule}>
        <div className="flex flex-col gap-5">
          {/* Top: profile image + the employee's "file" (Profile module) */}
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 lg:items-stretch">
            <Card className="lg:h-full">
              <CardContent className="px-5 py-6 flex flex-col items-center gap-4 h-full overflow-y-auto">
                <div className="relative w-full shrink-0">
                  <button
                    type="button"
                    onClick={() => photoUrl && setLightboxOpen(true)}
                    disabled={!photoUrl}
                    aria-label={
                      photoUrl
                        ? `View a larger photo of ${emp.fullName}`
                        : undefined
                    }
                    className="block w-full aspect-square overflow-hidden rounded-2xl bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring enabled:cursor-zoom-in"
                  >
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt={`${emp.fullName}, ${emp.jobTitle}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-6xl font-bold text-primary/70">
                          {emp.initials}
                        </span>
                      </div>
                    )}
                  </button>
                  {photoPending && (
                    <Badge
                      variant="outline"
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 gap-1 border-amber-500/30 bg-amber-500/90 text-[10px] text-white backdrop-blur"
                    >
                      <Clock className="w-2.5 h-2.5" /> New photo pending approval
                    </Badge>
                  )}
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground wrap-break-word">
                    {emp.fullName}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {emp.jobTitle}
                  </p>
                  {/* Which leave, not just "On Leave" (§C1). */}
                  {activeLeave && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "mt-2 text-[10px] font-medium",
                        leaveTypeTone(activeLeave.type),
                      )}
                    >
                      On {activeLeave.label} · back{" "}
                      {new Date(activeLeave.returnDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setPhotoDialogOpen(true)}
                >
                  <ImageUp className="w-4 h-4" />
                  {variant === "hr" ? "Change photo" : "Request image change"}
                </Button>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardContent className="px-5 py-5">
                <ProfileModule employeeId={id} employee={emp} />
              </CardContent>
            </Card>
          </div>

          {/* Stats strip — each tile is a CTA into the matching module (§B1). */}
          {stats && (
            <StatStrip
              items={STAT_TILES.map(({ label, module, accent, value, describe }) => ({
                label,
                accent,
                value: value(stats),
                onClick: () => goToModule(module),
                ariaLabel: describe(stats),
              }))}
            />
          )}

          {/* Module sidebar + content — fixed, equal height with internal scroll */}
          <div
            ref={moduleSectionRef}
            className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 lg:h-[calc(100vh-7rem)] scroll-mt-4"
          >
            <ModuleNav
              modules={navModules}
              active={active?.key ?? ""}
              onSelect={selectModule}
            />
            <Card className="min-w-0 flex flex-col lg:h-full">
              <CardContent className="px-5 py-5 flex-1 min-h-0 overflow-y-auto [&_[data-slot=tabs-trigger][data-state=active]]:bg-[#ff8b2d]! [&_[data-slot=tabs-trigger][data-state=active]]:text-white! [&_[data-slot=tabs-trigger][data-state=active]]:shadow-none!">
                {ActiveComponent && (
                  <ActiveComponent employeeId={id} employee={emp} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Photo upload/crop — the only route a photo change reaches the log. */}
          <PhotoChangeDialog
            open={photoDialogOpen}
            onOpenChange={setPhotoDialogOpen}
            mode={variant === "hr" ? "edit" : "request"}
            onSubmit={(dataUrl, reason) => {
              handlePhotoSubmit(dataUrl, reason);
              setPhotoDialogOpen(false);
            }}
          />

          {/* Full-size view of the current photo. */}
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-xl p-2">
              <DialogTitle className="sr-only">
                {emp.fullName}&apos;s profile photo
              </DialogTitle>
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={`${emp.fullName}, ${emp.jobTitle}`}
                  className="max-h-[80vh] w-full rounded-lg object-contain"
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </ModuleNavigationProvider>
    </ProfileVariantProvider>
  );
}
