"use client";

import { Package2 } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
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
import { ASSET_TYPE_ICONS } from "./constants";

interface AssetCardProps {
  asset: Asset;
  onPreview: (asset: Asset) => void;
}

export function AssetCard({ asset, onPreview }: AssetCardProps) {
  const TypeIcon = ASSET_TYPE_ICONS[asset.assetType] ?? Package2;

  return (
    <Card className="border border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <TypeIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{asset.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {asset.serialNumber}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium",
              ASSET_STATUS_STYLES[asset.status],
            )}
          >
            {ASSET_STATUS_LABELS[asset.status]}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium",
              ASSET_CONDITION_STYLES[asset.condition],
            )}
          >
            {ASSET_CONDITION_LABELS[asset.condition]}
          </Badge>
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
                {new Date(asset.assignedDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
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
          className="w-full text-xs"
          onClick={() => onPreview(asset)}
        >
          Preview Image
        </Button>
      </CardContent>
    </Card>
  );
}
