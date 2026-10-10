"use client";

import { useState } from "react";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { getApiErrorMessage } from "@/src/lib/utils";
import { businessUnitSchema } from "@/src/lib/validations/departments";
import {
  businessUnitsApi,
  useCreateBusinessUnitMutation,
  useDeleteBusinessUnitMutation,
  useGetBusinessUnitsQuery,
  useUpdateBusinessUnitMutation,
} from "@/src/store/services/business-units";

/** Business units group departments, e.g. by division or region. */
export function BusinessUnitsCard() {
  const { data, isLoading } = useGetBusinessUnitsQuery();
  const [createUnit, { isLoading: creating }] = useCreateBusinessUnitMutation();
  const [updateUnit, { isLoading: updating }] = useUpdateBusinessUnitMutation();
  const [deleteUnit] = useDeleteBusinessUnitMutation();
  const [fetchUnit] = businessUnitsApi.useLazyGetBusinessUnitQuery();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const units = data?.data ?? [];

  function reset() {
    setEditingId(null);
    setName("");
    setCode("");
  }

  /** Reads the unit fresh, so an edit starts from what the server holds. */
  async function handleEdit(id: string) {
    try {
      const unit = (await fetchUnit(id).unwrap()).data;
      setEditingId(unit.id);
      setName(unit.name);
      setCode(unit.code ?? "");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not open the business unit."));
    }
  }

  async function handleSave() {
    const existing = units.find((u) => u.id === editingId);
    const parsed = businessUnitSchema.safeParse({
      name,
      code: code || null,
      description: existing?.description ?? null,
      isActive: existing?.isActive ?? true,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      if (editingId) {
        await updateUnit({ id: editingId, body: parsed.data }).unwrap();
        toast.success(`${parsed.data.name} updated`);
      } else {
        await createUnit(parsed.data).unwrap();
        toast.success(`${parsed.data.name} created`);
      }
      reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the business unit."));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteUnit(id).unwrap();
      toast.success("Business unit deleted");
      if (editingId === id) reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete the business unit."));
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Business Units
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name, e.g. Retail Banking"
            className="h-8 min-w-48 flex-1 text-sm"
          />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Code"
            className="h-8 w-28 text-sm"
          />
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={creating || updating}
            onClick={handleSave}
          >
            {editingId ? null : <Plus className="h-3.5 w-3.5" />}
            {editingId ? "Save changes" : "Add"}
          </Button>
          {editingId && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={reset}
            >
              Cancel
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : units.length === 0 ? (
          <p className="text-sm text-muted-foreground">No business units yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {units.map((unit) => (
              <li
                key={unit.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2 text-sm text-foreground">
                    {unit.name}
                    {unit.code && (
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {unit.code}
                      </Badge>
                    )}
                    {!unit.isActive && (
                      <Badge variant="outline" className="text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {unit.departmentCount} department(s)
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label={`Edit ${unit.name}`}
                    onClick={() => handleEdit(unit.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label={`Delete ${unit.name}`}
                    onClick={() => handleDelete(unit.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
