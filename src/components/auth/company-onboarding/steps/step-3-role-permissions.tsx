"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Switch } from "@/src/components/ui/switch";
import { Badge } from "@/src/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateAccessControlConfig, markStepComplete, setCurrentStep } from "@/src/lib/stores/onboarding-slice";
import { PERMISSION_OPTIONS, AccessControlModel } from "@/src/lib/types/onboarding-setup.types";

const schema = z.object({
  model: z.enum(["RBAC", "PERMISSION", "HYBRID"]),
});

type FormValues = z.infer<typeof schema>;

export function Step3RolePermissions() {
  const dispatch = useAppDispatch();
  const config = useAppSelector((s) => s.onboarding.companySetup.accessControlConfig);

  const { handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { model: config.model },
  });

  const [roles, setRoles] = useState(config.roles);
  const [permissions, setPermissions] = useState<string[]>(config.permissions);

  const model = watch("model");

  const handleRoleRename = (id: string, newName: string) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, name: newName } : r)));
  };

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const onSubmit = (data: FormValues) => {
    dispatch(updateAccessControlConfig({ model: data.model, roles, permissions }));
    dispatch(markStepComplete(3));
    dispatch(setCurrentStep(4));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Access Control Model</Label>
        <RadioGroup
          defaultValue={config.model}
          onValueChange={(v) => setValue("model", v as AccessControlModel)}
          className="flex flex-col gap-3 mt-1"
        >
          {[
            { value: "RBAC", label: "Role-Based (RBAC)", desc: "Assign permissions through predefined roles" },
            { value: "PERMISSION", label: "Permission-Based", desc: "Granular control over individual capabilities" },
            { value: "HYBRID", label: "Hybrid", desc: "Combine roles and granular permissions" },
          ].map(({ value, label, desc }) => (
            <div key={value} className="flex items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={value} id={value} className="mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <label htmlFor={value} className="text-sm font-medium text-foreground cursor-pointer">{label}</label>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      {(model === "RBAC" || model === "HYBRID") && (
        <div className="flex flex-col gap-3">
          <Label>Define & Rename Roles</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map((role) => (
              <div key={role.id} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Original: {role.originalName}</span>
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
                <button
                  key={perm}
                  type="button"
                  onClick={() => togglePermission(perm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={active
                    ? { backgroundColor: "rgba(216,90,48,0.1)", borderColor: "rgba(216,90,48,0.4)", color: "#D85A30" }
                    : {}
                  }
                >
                  <Switch checked={active} className="scale-75 pointer-events-none" />
                  {perm.replace(/_/g, " ")}
                </button>
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
        <Button type="button" variant="outline" onClick={() => dispatch(setCurrentStep(2))}>
          Back
        </Button>
        <Button type="submit" style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}>
          Continue
        </Button>
      </div>
    </form>
  );
}
