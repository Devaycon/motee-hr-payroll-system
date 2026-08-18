"use client";

import { Plus, Trash2, Filter } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { OPERATOR_OPTIONS } from "@/src/data/recruitment-demo";
import { uid } from "@/src/lib/stores/recruitment-slice";
import type {
  ApplicationFormField,
  CriteriaCondition,
  FilterConstraint,
} from "@/src/lib/types/recruitment";

interface FilterConstraintsEditorProps {
  constraints: FilterConstraint[];
  onChange: (next: FilterConstraint[]) => void;
  /** The application-form fields built above (drive the condition selectors). */
  formFields: ApplicationFormField[];
}

export function FilterConstraintsEditor({
  constraints,
  onChange,
  formFields,
}: FilterConstraintsEditorProps) {
  function patch(id: string, p: Partial<FilterConstraint>) {
    onChange(constraints.map((c) => (c.id === id ? { ...c, ...p } : c)));
  }
  function patchConditions(
    id: string,
    conditions: CriteriaCondition[],
  ) {
    patch(id, { conditions });
  }
  function addConstraint() {
    onChange([
      ...constraints,
      { id: uid("FC"), name: "", match: "all", conditions: [] },
    ]);
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Filter className="w-3.5 h-3.5" />
            Applicant filters
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Build named filters off the fields above (e.g. “Graduates”, “Has
            certification”). These power the Filter dropdowns on each tab.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-[11px]"
          onClick={addConstraint}
        >
          <Plus className="w-3 h-3" />
          Add filter
        </Button>
      </div>

      {formFields.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add at least one application-form field above to build filters.
        </p>
      )}

      {constraints.map((fc) => (
        <div
          key={fc.id}
          className="space-y-2.5 rounded-md border border-border/60 bg-background p-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-[11px]">Filter name</Label>
              <Input
                value={fc.name}
                placeholder="e.g. First class graduates"
                onChange={(e) => patch(fc.id, { name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Match</Label>
              <Select
                value={fc.match}
                onValueChange={(v) =>
                  patch(fc.id, { match: v as "all" | "any" })
                }
              >
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6 h-8 w-8 text-destructive"
              onClick={() =>
                onChange(constraints.filter((c) => c.id !== fc.id))
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {fc.conditions.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1.5">
              <Select
                value={c.fieldId}
                onValueChange={(v) =>
                  patchConditions(
                    fc.id,
                    fc.conditions.map((x, j) =>
                      j === i ? { ...x, fieldId: v } : x,
                    ),
                  )
                }
              >
                <SelectTrigger className="h-8 w-40">
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  {formFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label || "(untitled)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={c.operator}
                onValueChange={(v) =>
                  patchConditions(
                    fc.id,
                    fc.conditions.map((x, j) =>
                      j === i
                        ? { ...x, operator: v as CriteriaCondition["operator"] }
                        : x,
                    ),
                  )
                }
              >
                <SelectTrigger className="h-8 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATOR_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="h-8 w-32"
                value={c.value}
                placeholder="value"
                onChange={(e) =>
                  patchConditions(
                    fc.id,
                    fc.conditions.map((x, j) =>
                      j === i ? { ...x, value: e.target.value } : x,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() =>
                  patchConditions(
                    fc.id,
                    fc.conditions.filter((_, j) => j !== i),
                  )
                }
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-[11px]"
            disabled={formFields.length === 0}
            onClick={() =>
              patchConditions(fc.id, [
                ...fc.conditions,
                {
                  fieldId: formFields[0]?.id ?? "",
                  operator: "eq",
                  value: "",
                },
              ])
            }
          >
            <Plus className="w-3 h-3" />
            Add condition
          </Button>
        </div>
      ))}
    </div>
  );
}
