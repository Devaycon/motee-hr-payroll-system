"use client";

import { useState, useMemo } from "react";
import { Package2, Search } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { ASSETS, ASSET_TYPE_LABELS } from "@/src/data/assets-demo";
import type { Asset } from "@/src/lib/types/assets";
import { MY_EMPLOYEE } from "./components/constants";
import { AssetCard } from "./components/asset-card";
import { AssetPreviewModal } from "./components/asset-preview-modal";
import { useAssets } from "@/src/components/hr/assets/hooks";
import { useAppSelector } from "@/src/lib/stores/hooks";

export function MyAssetsPage() {
  const { data: localeAssets } = useAssets();
  const employeeName = useAppSelector((s) => s.auth.user?.name);
  const MY_ASSETS = useMemo(() => {
    if (localeAssets && employeeName) {
      const own = localeAssets.filter((a) => a.assignedTo === employeeName);
      if (own.length) return own;
    }
    return ASSETS.filter((a) => a.assignedTo === MY_EMPLOYEE);
  }, [localeAssets, employeeName]);
  const [search, setSearch] = useState("");
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

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
        <div>
          <h1 className="text-4xl font-semibold">My Assets</h1>
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
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onPreview={setPreviewAsset}
            />
          ))}
        </div>
      )}

      <AssetPreviewModal
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
      />
    </div>
  );
}
