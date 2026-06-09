"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  ASSET_STATUS_LABELS,
  ASSET_STATUS_STYLES,
  ASSET_CONDITION_LABELS,
  ASSET_CONDITION_STYLES,
  ASSET_TYPE_LABELS,
} from "@/src/data/assets-demo";
import type { Asset } from "@/src/lib/types/assets";

interface AssetPreviewModalProps {
  asset: Asset | null;
  onClose: () => void;
}

export function AssetPreviewModal({ asset, onClose }: AssetPreviewModalProps) {
  return (
    <Dialog open={!!asset} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm gap-0 p-0">
        {asset && (
          <>
            <div className="flex h-52 items-center justify-center rounded-t-lg border-b border-border bg-muted">
              <p className="text-sm text-muted-foreground">
                Preview not available on demo mode
              </p>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {asset.serialNumber}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs font-medium",
                      ASSET_STATUS_STYLES[asset.status],
                    )}
                  >
                    {ASSET_STATUS_LABELS[asset.status]}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs font-medium",
                      ASSET_CONDITION_STYLES[asset.condition],
                    )}
                  >
                    {ASSET_CONDITION_LABELS[asset.condition]}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="text-foreground font-medium">
                    {ASSET_TYPE_LABELS[asset.assetType]}
                  </span>
                </div>
                {asset.assignedDate && (
                  <div className="flex justify-between">
                    <span>Assigned</span>
                    <span className="text-foreground font-medium">
                      {new Date(asset.assignedDate).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "long", year: "numeric" },
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Department</span>
                  <span className="text-foreground font-medium">
                    {asset.assignedToDepartment ?? "—"}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onClose}
              >
                <X className="mr-2 size-4" />
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
