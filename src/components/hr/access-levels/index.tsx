"use client";

import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type {
  AccessLevel,
  AccessLevelStatus,
  NewAccessLevel,
} from "./types";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { useAccessLevels, useRoleAssignments } from "./hooks";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { startPreview } from "@/src/lib/stores/access-levels-slice";
import {
  accessLevelFromApi,
  accessLevelToRequest,
} from "@/src/lib/access-levels/api-mapping";
import { getApiErrorMessage } from "@/src/lib/utils";
import { accessLevelSchema } from "@/src/lib/validations/access-levels";
import {
  accessLevelsApi,
  useChangeAccessLevelStatusMutation,
  useCreateAccessLevelMutation,
  useDeleteAccessLevelMutation,
  useGetAccessLevelCatalogueQuery,
  useUpdateAccessLevelMutation,
} from "@/src/store/services/access-levels";
import {
  StatCards,
  matchesAccessLevelCardFilter,
  ACCESS_LEVEL_CARD_FILTER_LABELS,
  type AccessLevelCardFilter,
} from "./components/stat-cards";
import { AccessLevelsList } from "./components/access-levels-list";
import { PermissionsMatrixModal } from "./components/permissions-matrix-modal";
import { AccessLevelFormModal } from "./components/access-level-form-modal";
import { AssignmentHistory } from "./components/assignment-history";
import { RoleConflicts } from "./components/role-conflicts";

export function AccessLevelsPage() {
  const dispatch = useAppDispatch();
  const levels = useAccessLevels();
  const assignments = useRoleAssignments();
  const [createAccessLevel] = useCreateAccessLevelMutation();
  const [updateAccessLevel] = useUpdateAccessLevelMutation();
  const [deleteAccessLevel] = useDeleteAccessLevelMutation();
  const [changeStatus] = useChangeAccessLevelStatusMutation();
  const [fetchLevel] = accessLevelsApi.useLazyGetAccessLevelQuery();
  const { data: catalogue } = useGetAccessLevelCatalogueQuery();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<AccessLevel | null>(null);
  const [viewLevel, setViewLevel] = useState<AccessLevel | null>(null);
  const [matrixOpen, setMatrixOpen] = useState(false);
  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("roles");
  /** Drill-down set by the KPI cards; "all" shows every role. */
  const [cardFilter, setCardFilter] = useState<AccessLevelCardFilter>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return levels.filter((l) => {
      const matchSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q);
      // The card drill-down composes with the search box.
      return matchSearch && matchesAccessLevelCardFilter(l, cardFilter);
    });
  }, [levels, search, cardFilter]);

  function handleView(level: AccessLevel) {
    setViewLevel(level);
    setMatrixOpen(true);
  }

  /** Opens the form on the role as the server holds it right now. */
  async function handleEdit(level: AccessLevel) {
    try {
      const fresh = (await fetchLevel(level.id).unwrap()).data;
      setEditingLevel(accessLevelFromApi(fresh));
    } catch {
      setEditingLevel(level);
    }
    setFormOpen(true);
  }

  function handleAdd() {
    setEditingLevel(null);
    setFormOpen(true);
  }

  async function handleDuplicate(level: AccessLevel) {
    try {
      await createAccessLevel(
        accessLevelToRequest(
          { ...level, name: `${level.name} (Copy)` },
          level.id,
        ),
      ).unwrap();
      toast.success(`Cloned "${level.name}"`, {
        description: "The clone starts as a Draft — review it before assigning.",
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not clone the role."));
    }
  }

  async function handleDelete(id: string) {
    const level = levels.find((l) => l.id === id);
    // §1.9 — the server refuses too; this is the message the user sees.
    if (level?.kind === "default") {
      toast.error("System roles can't be deleted", {
        description: "Clone it to customise, or deactivate it to retire it.",
      });
      return;
    }
    try {
      await deleteAccessLevel(id).unwrap();
      toast.success("Access level deleted");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete the role."));
    }
  }

  async function handleSetStatus(id: string, status: AccessLevelStatus) {
    try {
      await changeStatus({ id, body: { status } }).unwrap();
      toast.success(
        status === "active" ? "Role activated" : "Role deactivated",
        status === "inactive"
          ? { description: "It can no longer be assigned to employees." }
          : undefined,
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not change the role status."));
    }
  }

  /** §1.10 — see the app as this role sees it, until Exit is pressed. */
  function handlePreview(level: AccessLevel) {
    dispatch(startPreview(level.id));
    toast.info(`Previewing as "${level.name}"`, {
      description:
        "Navigate anywhere — the banner at the top exits the preview.",
    });
  }

  async function handleSave(data: NewAccessLevel | AccessLevel) {
    // The app knows screens the server has no permission for yet; sending
    // those would be refused, so the grant list is cut down to the catalogue.
    const known = catalogue?.data?.modules;
    const request = accessLevelToRequest(data);
    if (known) {
      request.permissions = request.permissions.filter((p) =>
        known.includes(p.module),
      );
    }
    const parsed = accessLevelSchema.safeParse(request);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      if ("id" in data) {
        const previous = levels.find((l) => l.id === data.id);
        await updateAccessLevel({ id: data.id, body: parsed.data }).unwrap();
        // Status has its own endpoint; only call it when the form changed it.
        if (previous && previous.status !== data.status) {
          await changeStatus({
            id: data.id,
            body: { status: data.status },
          }).unwrap();
        }
        toast.success(`"${data.name}" updated`);
      } else {
        const created = (await createAccessLevel(parsed.data).unwrap()).data;
        if (created.status !== data.status) {
          await changeStatus({
            id: created.id,
            body: { status: data.status },
          }).unwrap();
        }
        toast.success(`"${data.name}" created`);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the role."));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Roles &amp; Permissions
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

      <StatCards
        levels={levels}
        activeTab={activeTab}
        cardFilter={cardFilter}
        onDrillDown={(tab, filter) => {
          setActiveTab(tab);
          setCardFilter(filter);
        }}
        onViewMatrix={() => {
          // No specific role selected — the matrix opens on the full grid.
          setViewLevel(null);
          setMatrixOpen(true);
        }}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {ACCESS_LEVEL_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">({filtered.length})</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All roles
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "roles", label: `Roles (${filtered.length})` },
            {
              value: "history",
              label: `Assignment History (${assignments.length})`,
            },
            { value: "conflicts", label: "My Role Conflicts" },
          ]}
        />

        <TabsContent value="roles" className="mt-5 space-y-4">
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
            onSetStatus={handleSetStatus}
            onPreview={handlePreview}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <AssignmentHistory events={assignments} />
        </TabsContent>

        <TabsContent value="conflicts" className="mt-5">
          <RoleConflicts />
        </TabsContent>
      </Tabs>

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
