"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  Building2,
  Upload,
  ShieldCheck,
  Save,
  Users,
  Pencil,
  MapPin,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
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
  useAllBranches,
  useBranchHeadcounts,
} from "@/src/lib/branches/use-branch";
import { BRANCH_KIND_LABELS } from "@/src/lib/types/branches";
import type { ProfileData, VerificationStage } from "../types";
import { STAGE_ICONS, STAGE_STYLES, ACTIVITY_STATS } from "../data";

/**
 * Every site the company operates from. Read unscoped on purpose — the company
 * profile describes the whole company, whichever branch the app is showing.
 */
function LocationsCard() {
  const branches = useAllBranches();
  const headcounts = useBranchHeadcounts();

  if (branches.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <CardTitle className="text-sm font-medium">
          Locations{" "}
          <span className="text-muted-foreground font-normal">
            ({branches.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-1">
          {branches.map((b) => (
            <Link
              key={b.id}
              href={`/organization/branches/${b.id}`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-accent transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{b.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {BRANCH_KIND_LABELS[b.kind]}
                  {b.city ? ` · ${b.city}` : ""}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {headcounts[b.id] ?? 0}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 w-full mt-3 text-xs"
        >
          <Link href="/organization/branches">Manage branches</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

type ProfileTabProps = {
  editing: boolean;
  setEditing: (v: boolean) => void;
  profile: ProfileData;
  profileDraft: ProfileData;
  setProfileDraft: React.Dispatch<React.SetStateAction<ProfileData>>;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  cacLabel: string;
  cacStatus: VerificationStage;
  cacNumber: string;
  tinLabel: string;
  tinStatus: VerificationStage;
  tinNumber: string;
};

export function ProfileTab({
  editing,
  setEditing,
  profile,
  profileDraft,
  setProfileDraft,
  setProfile,
  cacLabel,
  cacStatus,
  cacNumber,
  tinLabel,
  tinStatus,
  tinNumber,
}: ProfileTabProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  function saveProfile() {
    setProfile(profileDraft);
    setEditing(false);
  }

  function cancelEdit() {
    setProfileDraft(profile);
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <CardTitle className="text-sm font-medium">
                Company Details
              </CardTitle>
            </div>
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => {
                  setProfileDraft(profile);
                  setEditing(true);
                }}
              >
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-start gap-4 mb-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden">
                  <Building2 className="w-7 h-7 text-muted-foreground" />
                </div>
                {editing && (
                  <button
                    className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 text-white" />
                  </button>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <Input
                    value={profileDraft.name}
                    onChange={(e) =>
                      setProfileDraft((p) => ({ ...p, name: e.target.value }))
                    }
                    className="h-8 text-sm font-semibold mb-2"
                  />
                ) : (
                  <p className="text-lg font-bold text-foreground">
                    {profile.name}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {profile.industry}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {profile.size} employees
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {profile.country}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  { label: "Industry", key: "industry" as const },
                  { label: "Company Size", key: "size" as const },
                  { label: "Country", key: "country" as const },
                  { label: "Website", key: "website" as const },
                  { label: "Contact Email", key: "contactEmail" as const },
                  { label: "Contact Phone", key: "contactPhone" as const },
                ] as { label: string; key: keyof ProfileData }[]
              ).map(({ label, key }) => (
                <div key={key}>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {label}
                  </Label>
                  {editing ? (
                    key === "size" ? (
                      <Select
                        value={profileDraft.size}
                        onValueChange={(v) =>
                          setProfileDraft((p) => ({ ...p, size: v }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "1–10",
                            "11–50",
                            "51–200",
                            "201–500",
                            "501–1000",
                            "1000+",
                          ].map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={profileDraft[key]}
                        onChange={(e) =>
                          setProfileDraft((p) => ({
                            ...p,
                            [key]: e.target.value,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                    )
                  ) : (
                    <p className="text-sm text-foreground">{profile[key]}</p>
                  )}
                </div>
              ))}

              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Address
                </Label>
                {editing ? (
                  <Input
                    value={profileDraft.address}
                    onChange={(e) =>
                      setProfileDraft((p) => ({
                        ...p,
                        address: e.target.value,
                      }))
                    }
                    className="h-8 text-xs"
                  />
                ) : (
                  <p className="text-sm text-foreground">{profile.address}</p>
                )}
              </div>
            </div>

            {editing && (
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={saveProfile}
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <LocationsCard />

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <CardTitle className="text-sm font-medium">
                Verification Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-3">
                {(
                  [
                    {
                      label: cacLabel,
                      status: cacStatus,
                      number: cacNumber,
                    },
                    {
                      label: tinLabel,
                      status: tinStatus,
                      number: tinNumber,
                    },
                  ] as {
                    label: string;
                    status: VerificationStage;
                    number: string;
                  }[]
                ).map((item) => {
                  const Icon = STAGE_ICONS[item.status];
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.number}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 shrink-0 ${STAGE_STYLES[item.status]}`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <CardTitle className="text-sm font-medium">
                Company Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col gap-3">
                {[
                  { label: "Size Range", value: profile.size },
                  { label: "Max Users", value: "300" },
                  { label: "Active Services", value: "8 modules" },
                  { label: "Plan", value: "Business" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-xs text-muted-foreground">
                      {row.label}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">
            Company Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-4 gap-4">
            {ACTIVITY_STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
