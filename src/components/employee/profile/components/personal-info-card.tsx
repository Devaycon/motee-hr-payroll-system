"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { DEMO_MY_PROFILE } from "@/src/data/employee-demo";

function InfoRow({
  label,
  value,
  editable,
  fieldKey,
  editingKey,
  draft,
  onEdit,
  onDraftChange,
  onSave,
  onCancel,
}: {
  label: string;
  value?: string | null;
  editable?: boolean;
  fieldKey?: string;
  editingKey?: string | null;
  draft?: string;
  onEdit?: (key: string, current: string) => void;
  onDraftChange?: (val: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
}) {
  const isEditing = editable && fieldKey && editingKey === fieldKey;

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-36 shrink-0">
        {label}:
      </span>
      {isEditing ? (
        <div className="flex items-center gap-1.5 flex-1">
          <Input
            value={draft}
            onChange={(e) => onDraftChange?.(e.target.value)}
            className="h-6 text-xs px-2"
            autoFocus
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-[#1D9E75]"
            onClick={onSave}
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground"
            onClick={onCancel}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between flex-1 gap-2">
          <span className="text-xs text-foreground font-medium">
            {value ?? (
              <span className="italic text-muted-foreground/50">—</span>
            )}
          </span>
          {editable && fieldKey && (
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={() => onEdit?.(fieldKey, value ?? "")}
            >
              <Pencil className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function PersonalInfoCard() {
  const p = DEMO_MY_PROFILE;
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [values, setValues] = useState({
    phone: p.phone,
    street: p.address.street,
    city: p.address.city,
    state: p.address.state,
    postalCode: p.address.postalCode,
  });

  const handleEdit = (key: string, current: string) => {
    setEditingKey(key);
    setDraft(current);
  };
  const handleSave = () => {
    if (editingKey) setValues((prev) => ({ ...prev, [editingKey]: draft }));
    setEditingKey(null);
  };
  const handleCancel = () => setEditingKey(null);

  const rowProps = {
    editingKey,
    draft,
    onEdit: handleEdit,
    onDraftChange: setDraft,
    onSave: handleSave,
    onCancel: handleCancel,
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
          Personal Information
          <span className="text-[10px] font-normal text-muted-foreground flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Editable fields save instantly
          </span>
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="px-5 pb-4 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <div className="group">
            <InfoRow
              label="Phone"
              value={values.phone}
              editable
              fieldKey="phone"
              {...rowProps}
            />
          </div>
          <InfoRow label="Personal email" value={p.email} />
          <InfoRow label="Date of birth" value="1992-07-14" />
          <InfoRow label="Gender" value="Male" />
          <InfoRow label="Nationality" value="Nigerian" />
          <InfoRow label="Marital status" value="Single" />
          <div className="group">
            <InfoRow
              label="Street address"
              value={values.street}
              editable
              fieldKey="street"
              {...rowProps}
            />
          </div>
          <div className="group">
            <InfoRow
              label="City"
              value={values.city}
              editable
              fieldKey="city"
              {...rowProps}
            />
          </div>
          <div className="group">
            <InfoRow
              label="State"
              value={values.state}
              editable
              fieldKey="state"
              {...rowProps}
            />
          </div>
          <InfoRow label="Country" value={p.address.country} />
          <div className="group">
            <InfoRow
              label="Postal code"
              value={values.postalCode}
              editable
              fieldKey="postalCode"
              {...rowProps}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
