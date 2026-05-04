"use client";

import { useState, useMemo } from "react";
import { ShieldCheck, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { ACCESS_LEVELS } from "./data";
import type { AccessLevel, NewAccessLevel } from "./types";
import { StatCards } from "./components/stat-cards";
import { AccessLevelsList } from "./components/access-levels-list";
import { PermissionsMatrixModal } from "./components/permissions-matrix-modal";
import { AccessLevelFormModal } from "./components/access-level-form-modal";

export function AccessLevelsPage() {
  const [levels, setLevels] = useState<AccessLevel[]>(ACCESS_LEVELS);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<AccessLevel | null>(null);
  const [viewLevel, setViewLevel] = useState<AccessLevel | null>(null);
  const [matrixOpen, setMatrixOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q
      ? levels
      : levels.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q),
        );
  }, [levels, search]);

  function handleView(level: AccessLevel) {
    setViewLevel(level);
    setMatrixOpen(true);
  }

  function handleEdit(level: AccessLevel) {
    setEditingLevel(level);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditingLevel(null);
    setFormOpen(true);
  }

  function handleDuplicate(level: AccessLevel) {
    const copy: AccessLevel = {
      ...level,
      id: `al-${Date.now()}`,
      name: `${level.name} (Copy)`,
      kind: "custom",
      employeeCount: 0,
      lastModifiedBy: "You",
      lastModifiedAt: "2026-04-04",
      permissions: level.permissions.map((p) => ({
        ...p,
        actions: [...p.actions],
      })),
    };
    setLevels((prev) => [...prev, copy]);
    toast.success(`Duplicated &ldquo;${level.name}&rdquo;`);
  }

  function handleDelete(id: string) {
    setLevels((prev) => prev.filter((l) => l.id !== id));
    toast.success("Access level deleted");
  }

  function handleSave(data: NewAccessLevel | AccessLevel) {
    if ("id" in data) {
      setLevels((prev) =>
        prev.map((l) =>
          l.id === (data as AccessLevel).id ? (data as AccessLevel) : l,
        ),
      );
    } else {
      const newLevel: AccessLevel = {
        ...(data as NewAccessLevel),
        id: `al-${Date.now()}`,
        kind: "custom",
        employeeCount: 0,
        lastModifiedBy: "You",
        lastModifiedAt: "2026-04-04",
      };
      setLevels((prev) => [...prev, newLevel]);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Access Levels &amp; Permissions
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage roles and control what each user type can see and do
            </p>
          </div>
        </div>
        <Button onClick={handleAdd} className="shrink-0 self-start" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Create Access Level
        </Button>
      </div>

      <StatCards levels={levels} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search access levels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <AccessLevelsList
        levels={filtered}
        onView={handleView}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />

      <PermissionsMatrixModal
        level={viewLevel}
        open={matrixOpen}
        onClose={() => setMatrixOpen(false)}
      />

      <AccessLevelFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        editingLevel={editingLevel}
        onSave={handleSave}
      />
    </div>
  );
}
