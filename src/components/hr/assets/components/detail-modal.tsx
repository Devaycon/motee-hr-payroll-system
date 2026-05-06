"use client";

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
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import {
  ASSET_STATUS_LABELS,
  ASSET_STATUS_STYLES,
  ASSET_CONDITION_LABELS,
  ASSET_CONDITION_STYLES,
  ASSET_TYPE_LABELS,
  ASSET_HISTORY_LABELS,
  ASSET_HISTORY_STYLES,
} from "../data";
import type { Asset } from "../types";

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

function formatNaira(value?: number) {
  if (value === undefined || value === null) return "—";
  return `₦${value.toLocaleString("en-NG")}`;
}

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
}

export function DetailModal({ open, onClose, asset }: DetailModalProps) {
  if (!asset) return null;
  const TypeIcon = ASSET_TYPE_ICONS[asset.assetType] ?? Package2;
  const sortedHistory = [...asset.history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="px-6 pb-0 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                <TypeIcon className="size-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-semibold leading-tight">
                  {asset.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {asset.serialNumber}
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`mt-1 shrink-0 text-xs font-medium ${ASSET_STATUS_STYLES[asset.status]}`}
            >
              {ASSET_STATUS_LABELS[asset.status]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {asset.imageUrl && (
            <div className="overflow-hidden rounded-lg border border-border">
              <img
                src={asset.imageUrl}
                alt={asset.name}
                className="h-44 w-full object-contain bg-muted"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm font-medium">
                {ASSET_TYPE_LABELS[asset.assetType]}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Condition</p>
              <Badge
                variant="secondary"
                className={`text-xs font-medium ${ASSET_CONDITION_STYLES[asset.condition]}`}
              >
                {ASSET_CONDITION_LABELS[asset.condition]}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Assigned To</p>
              <p className="text-sm font-medium">
                {asset.assignedTo ?? "Unassigned"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="text-sm font-medium">
                {asset.assignedToDepartment ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Purchase Date</p>
              <p className="text-sm font-medium">
                {formatDate(asset.purchaseDate)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Purchase Value</p>
              <p className="text-sm font-medium">
                {formatNaira(asset.purchaseValue)}
              </p>
            </div>
          </div>

          {asset.conditionNotes && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="mt-0.5 text-sm">{asset.conditionNotes}</p>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Asset History
            </p>
            <ScrollArea className="h-52 pr-3">
              <div className="relative space-y-0">
                {sortedHistory.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`mt-1 size-2.5 shrink-0 rounded-full ${ASSET_HISTORY_STYLES[entry.action]}`}
                      />
                      {i < sortedHistory.length - 1 && (
                        <div className="my-1 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-4 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium">
                          {ASSET_HISTORY_LABELS[entry.action]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {formatDate(entry.date)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {entry.description}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        By {entry.performedBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end border-t border-border/60 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="mr-2 size-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
