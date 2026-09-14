"use client";

import { useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Switch } from "@/src/components/ui/switch";
import { Badge } from "@/src/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip";
import { Info } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  updateAccessControlConfig,
  markStepComplete,
  setCurrentStep,
} from "@/src/lib/stores/onboarding-slice";
import {
  PERMISSION_OPTIONS,
  AccessControlModel,
} from "@/src/lib/types/onboarding-setup.types";

function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="More information"
          >
            <Info size={13} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const ACCESS_CONTROL_OPTIONS = [
  {
    value: "RBAC",
    label: "Role-Based (RBAC)",
    desc: "Users are assigned a role, and permissions are inherited from that role.",
    badge: "Recommended for most organisations",
  },
  {
    value: "PERMISSION",
    label: "Permission-Based",
    desc: "Permissions are assigned individually rather than through roles.",
    badge: "Advanced security configuration",
  },
  {
    value: "HYBRID",
    label: "Hybrid",
    desc: "Start with roles and then add or remove individual permissions.",
    badge: "Recommended for enterprise organisations",
  },
] as const;

export function Step3RolePermissions() {
  const dispatch = useAppDispatch();
  const config = useAppSelector(
    (s) => s.onboarding.companySetup.accessControlConfig,
  );

  const [model, setModel] = useState<AccessControlModel>(config.model);
  const [roles, setRoles] = useState(config.roles);
  const [permissions, setPermissions] = useState<string[]>(config.permissions);

  const handleModelChange = (v: string) => {
    setModel(v as AccessControlModel);
  };

  const handleRoleRename = (id: string, newName: string) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: newName } : r)),
    );
  };

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const onSubmit = () => {
    dispatch(updateAccessControlConfig({ model, roles, permissions }));
    dispatch(markStepComplete(3));
    dispatch(setCurrentStep(4));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Access Control Model</Label>
        <RadioGroup
          value={model}
          onValueChange={handleModelChange}
          className="flex flex-col gap-3 mt-1"
        >
          {ACCESS_CONTROL_OPTIONS.map(({ value, label, desc, badge }) => (
            <div
              key={value}
              className="flex items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
            >
              <RadioGroupItem value={value} id={value} className="mt-0.5" />
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <label
                    htmlFor={value}
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    {label}
                  </label>
                  <InfoTooltip text={desc} />
                  {value === "RBAC" && (
                    <Badge variant="secondary" className="text-[10px]">Recommended default</Badge>
                  )}
                  {value === "HYBRID" && (
                    <Badge className="text-[10px]" style={{ backgroundColor: "rgba(216,90,48,0.12)", color: "#D85A30", borderColor: "rgba(216,90,48,0.3)" }}>
                      ⭐ Recommended for enterprise
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{desc}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{badge}</span>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      {(model === "RBAC" || model === "HYBRID") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Label>Define and rename Roles</Label>
            <InfoTooltip text="Rename each role to match your organisation's terminology. The permissions attached to a role stay the same — only the label changes." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map((role) => (
              <div key={role.id} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Original: {role.originalName}
                </span>
                <Input
                  value={role.name}
                  onChange={(e) => handleRoleRename(role.id, e.target.value)}
                  placeholder={role.originalName}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {(model === "PERMISSION" || model === "HYBRID") && (
        <div className="flex flex-col gap-3">
          <Label>Toggle Permissions</Label>
          <div className="flex flex-wrap gap-2">
            {PERMISSION_OPTIONS.map((perm) => {
              const active = permissions.includes(perm);
              return (
                <div
                  key={perm}
                  role="button"
                  tabIndex={0}
                  onClick={() => togglePermission(perm)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      togglePermission(perm);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer"
                  style={
                    active
                      ? {
                          backgroundColor: "rgba(216,90,48,0.1)",
                          borderColor: "rgba(216,90,48,0.4)",
                          color: "#D85A30",
                        }
                      : {}
                  }
                >
                  <Switch
                    checked={active}
                    className="scale-75 pointer-events-none"
                  />
                  {perm.replace(/_/g, " ")}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {permissions.map((p) => (
              <Badge key={p} variant="secondary" className="text-[10px]">
                {p.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => dispatch(setCurrentStep(2))}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
