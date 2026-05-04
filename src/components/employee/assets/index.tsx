"use client";

import { useState } from "react";
import {
  Package2,
  Laptop2,
  Monitor,
  Smartphone,
  Tablet,
  Printer,
  Keyboard,
  Mouse,
  Headphones,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  ASSETS,
  ASSET_STATUS_LABELS,
  ASSET_STATUS_STYLES,
  ASSET_CONDITION_LABELS,
  ASSET_CONDITION_STYLES,
  ASSET_TYPE_LABELS,
} from "@/src/data/assets-demo";
import { cn } from "@/src/lib/utils";

const MY_EMPLOYEE = "Adaeze Okonkwo";

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
  other: Package2,
};

const MY_ASSETS = ASSETS.filter((a) => a.assignedTo === MY_EMPLOYEE);

export function MyAssetsPage() {
  const [search, setSearch] = useState("");

  const filtered = MY_ASSETS.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.serialNumber.toLowerCase().includes(q) ||
      (ASSET_TYPE_LABELS[a.assetType] ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Package2 className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">My Assets</h1>
          <p className="text-sm text-muted-foreground">
            View all assets and equipment assigned to you.
          </p>
        </div>
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search assets..."
          className="h-10 pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Package2 className="size-8 opacity-30" />
          <p className="text-sm">No assets found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((asset) => {
            const TypeIcon = ASSET_TYPE_ICONS[asset.assetType] ?? Package2;
            return (
              <Card key={asset.id} className="border border-border/60">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <TypeIcon className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {asset.name}
                      </p>
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
                          {new Date(asset.assignedDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
