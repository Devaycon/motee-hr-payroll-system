"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { LifecycleBandItem } from "../data";

interface SupportingBandProps {
  title: string;
  description: string;
  icon: LucideIcon;
  items: LifecycleBandItem[];
  tone: "muted" | "accent";
}

export function SupportingBand({
  title,
  description,
  icon: Icon,
  items,
  tone,
}: SupportingBandProps) {
  return (
    <section
      className={
        tone === "accent"
          ? "rounded-2xl border border-primary/20 bg-primary/5 p-6"
          : "rounded-2xl border border-border bg-muted/30 p-6"
      }
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4.5 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <ItemIcon className="size-3.5 text-muted-foreground" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
