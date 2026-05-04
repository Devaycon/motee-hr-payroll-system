"use client";

import { useState } from "react";
import {
  Laptop2,
  Monitor,
  Smartphone,
  Tablet,
  Printer,
  Keyboard,
  Mouse,
  Headphones,
  Camera,
  Package2,
  MoreHorizontal,
  PlusCircle,
  Search,
  Eye,
  Pencil,
  UserPlus,
  Undo2,
  Wrench,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  ASSET_STATUS_LABELS,
  ASSET_STATUS_STYLES,
  ASSET_CONDITION_LABELS,
  ASSET_CONDITION_STYLES,
  ASSET_TYPE_LABELS,
  ASSET_TYPE_OPTIONS,
  DEPARTMENT_OPTIONS,
} from "../data";
import type { Asset, AssetStatus, AssetType } from "../types";

const ASSET_TYPE_ICONS: Record<string, React.ElementType> = {
  laptop: Laptop2,
  desktop: Monitor,
  monitor: Monitor,
  phone: Smartphone,
  tablet: Tablet,
  printer: Printer,
  keyboard: Keyboard,
  mouse: Mouse,
  headset: Headphones,
  camera: Camera,
  other: Package2,
};

interface AssetsTableProps {
  assets: Asset[];
  onView: (a: Asset) => void;
  onEdit: (a: Asset) => void;
  onAssign: (a: Asset) => void;
  onReturn: (a: Asset) => void;
  onSendToMaintenance: (id: string) => void;
  onDecommission: (id: string) => void;
  onAddAsset: () => void;
}

function formatNaira(value?: number) {
  if (value === undefined || value === null) return "—";
  return `₦${value.toLocaleString("en-NG")}`;
}

export function AssetsTable({
  assets,
  onView,
  onEdit,
  onAssign,
  onReturn,
  onSendToMaintenance,
  onDecommission,
  onAddAsset,
}: AssetsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [deptFilter, setDeptFilter] = useState("all");

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      a.name.toLowerCase().includes(q) ||
      a.serialNumber.toLowerCase().includes(q) ||
      (a.assignedTo ?? "").toLowerCase().includes(q);
    const matchType = typeFilter === "all" || a.assetType === typeFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchDept =
      deptFilter === "all" || a.assignedToDepartment === deptFilter;
    return matchSearch && matchType && matchStatus && matchDept;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              className="h-9 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as AssetType | "all")}
          >
            <SelectTrigger className="h-10 w-35">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ASSET_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {ASSET_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as AssetStatus | "all")}
          >
            <SelectTrigger className="h-10 w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(
                [
                  "assigned",
                  "available",
                  "under_maintenance",
                  "decommissioned",
                ] as AssetStatus[]
              ).map((s) => (
                <SelectItem key={s} value={s}>
                  {ASSET_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-10 w-40">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENT_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="lg" onClick={onAddAsset} className="shrink-0">
          <PlusCircle className="mr-2 size-4" />
          Add Asset
        </Button>
      </div>

      <div className="rounded-lg border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-65">Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-13" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                    <Package2 className="size-8 opacity-30" />
                    <p className="text-sm">No assets found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((asset) => {
              const TypeIcon = ASSET_TYPE_ICONS[asset.assetType] ?? Package2;
              return (
                <TableRow key={asset.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <TypeIcon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {asset.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {asset.serialNumber}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {ASSET_TYPE_LABELS[asset.assetType]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {asset.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {asset.assignedToInitials}
                          </div>
                          {asset.pendingReturn && (
                            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-card" />
                          )}
                        </div>
                        <span className="text-sm">{asset.assignedTo}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {asset.assignedToDepartment ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs font-medium ${ASSET_CONDITION_STYLES[asset.condition]}`}
                    >
                      {ASSET_CONDITION_LABELS[asset.condition]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {formatNaira(asset.purchaseValue)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs font-medium ${ASSET_STATUS_STYLES[asset.status]}`}
                    >
                      {ASSET_STATUS_LABELS[asset.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onView(asset)}>
                          <Eye className="mr-2 size-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(asset)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        {asset.status === "available" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onAssign(asset)}>
                              <UserPlus className="mr-2 size-4" />
                              Assign to Employee
                            </DropdownMenuItem>
                          </>
                        )}
                        {asset.status === "assigned" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onReturn(asset)}>
                              <Undo2 className="mr-2 size-4" />
                              Record Return
                            </DropdownMenuItem>
                          </>
                        )}
                        {asset.status !== "under_maintenance" &&
                          asset.status !== "decommissioned" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onSendToMaintenance(asset.id)}
                              >
                                <Wrench className="mr-2 size-4" />
                                Send to Maintenance
                              </DropdownMenuItem>
                            </>
                          )}
                        {asset.status !== "decommissioned" && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDecommission(asset.id)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Decommission
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {assets.length} assets
      </p>
    </div>
  );
}
