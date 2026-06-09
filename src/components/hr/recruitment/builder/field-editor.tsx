"use client";

import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  FORM_FIELD_TYPE_LABELS,
  CHOICE_FIELD_TYPES,
} from "@/src/data/recruitment-demo";
import { uid } from "@/src/lib/stores/recruitment-slice";
import type {
  ApplicationFormField,
  FormFieldConstraints,
  FormFieldType,
} from "@/src/lib/types/recruitment";
import { DynamicFieldPreview } from "./dynamic-field";

const FIELD_TYPES = Object.keys(FORM_FIELD_TYPE_LABELS) as FormFieldType[];

/** Editable draft of an application-form / quiz field. */
export interface FieldDraft {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  optionsText: string;
  min: string;
  max: string;
}

export function emptyField(partial?: Partial<FieldDraft>): FieldDraft {
  return {
    id: uid("FLD"),
    type: "short_text",
    label: "",
    required: false,
    optionsText: "",
    min: "",
    max: "",
    ...partial,
  };
}

export function fieldFromModel(f: ApplicationFormField): FieldDraft {
  return {
    id: f.id,
    type: f.type,
    label: f.label,
    required: f.required,
    optionsText: (f.options ?? f.constraints?.allowedValues ?? []).join(", "),
    min: f.constraints?.min != null ? String(f.constraints.min) : "",
    max: f.constraints?.max != null ? String(f.constraints.max) : "",
  };
}

export function buildField(d: FieldDraft): ApplicationFormField {
  const isChoice = CHOICE_FIELD_TYPES.includes(d.type);
  const options = isChoice
    ? d.optionsText.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  const constraints: FormFieldConstraints = {};
  if (d.min !== "") constraints.min = Number(d.min);
  if (d.max !== "") constraints.max = Number(d.max);
  if (isChoice && options && options.length) constraints.allowedValues = options;
  return {
    id: d.id,
    type: d.type,
    label: d.label.trim(),
    required: d.required,
    options: options && options.length ? options : undefined,
    constraints: Object.keys(constraints).length ? constraints : undefined,
  };
}

export function fieldChoiceOptions(d: FieldDraft): string[] {
  return d.optionsText.split(",").map((s) => s.trim()).filter(Boolean);
}

interface FieldEditorProps {
  field: FieldDraft;
  onChange: (patch: Partial<FieldDraft>) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  showPreview?: boolean;
  /** Extra controls rendered under the field (e.g. quiz correct-answers). */
  children?: React.ReactNode;
}

export function FieldEditor({
  field: f,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp = true,
  canMoveDown = true,
  showPreview = true,
  children,
}: FieldEditorProps) {
  const isChoice = CHOICE_FIELD_TYPES.includes(f.type);
  const isNumeric = f.type === "number";
  const showLength = isNumeric || f.type === "short_text" || f.type === "long_text";

  return (
    <div className="rounded-lg border border-border/60 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label className="text-[11px]">Field label</Label>
            <Input
              value={f.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="e.g. Years of experience"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label className="text-[11px]">Type</Label>
            <Select
              value={f.type}
              onValueChange={(v) => onChange({ type: v as FormFieldType })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {FORM_FIELD_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isChoice && (
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[11px]">Options (comma-separated)</Label>
              <Input
                value={f.optionsText}
                onChange={(e) => onChange({ optionsText: e.target.value })}
                placeholder="0-2 years, 3-5 years, 5+ years"
              />
            </div>
          )}
          {showLength && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[11px]">
                  {isNumeric ? "Min value" : "Min length"}
                </Label>
                <Input
                  type="number"
                  value={f.min}
                  onChange={(e) => onChange({ min: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">
                  {isNumeric ? "Max value" : "Max length"}
                </Label>
                <Input
                  type="number"
                  value={f.max}
                  onChange={(e) => onChange({ max: e.target.value })}
                />
              </div>
            </>
          )}
          <label className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={f.required}
              onCheckedChange={(v) => onChange({ required: Boolean(v) })}
            />
            Required field
          </label>
        </div>
        {(onMoveUp || onMoveDown || onRemove) && (
          <div className="flex flex-col gap-0.5">
            {onMoveUp && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={!canMoveUp}
                onClick={onMoveUp}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
            )}
            {onMoveDown && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={!canMoveDown}
                onClick={onMoveDown}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </Button>
            )}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={onRemove}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {children}

      {showPreview && (
        <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
            Preview
          </p>
          <DynamicFieldPreview field={buildField(f)} />
        </div>
      )}
    </div>
  );
}
