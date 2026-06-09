"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export interface HrStatCardItem {
  label: string;
  value: string | number;
  sub: string;
  /** Optional "View" link. When omitted, no action button is shown. */
  link?: string;
  icon: LucideIcon;
  trend?: string;
  up?: boolean;
}

interface HrStatCardProps {
  stat: HrStatCardItem;
}

export function HrStatCard({ stat }: HrStatCardProps) {
  return (
    <Card className="transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#7F77DD]/10">
            <stat.icon className="w-3.5 h-3.5 text-[#7F77DD]" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {stat.label}
          </span>
        </div>
        {stat.link && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground gap-1"
          >
            <Link href={stat.link}>
              View
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
          </div>
          {stat.trend !== undefined && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-2 py-0.5 font-medium gap-0.5",
                stat.up
                  ? "border-[#4ED251]/40 bg-[#4ED251]/10 text-[#4ED251]"
                  : "border-orange-600/50 bg-orange-600/5 text-red-600",
              )}
            >
              {stat.trend}
              {stat.up ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3 " />
              )}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface HrStatCardsGridProps {
  stats: HrStatCardItem[];
  columns?: 2 | 3 | 4 | 8;
}

export function HrStatCardsGrid({ stats, columns = 4 }: HrStatCardsGridProps) {
  return (
    <div
      className={cn("grid gap-4", {
        "grid-cols-2": columns === 2,
        "grid-cols-3": columns === 3,
        "grid-cols-4": columns === 4,
        "grid-cols-4 xl:grid-cols-8": columns === 8,
      })}
    >
      {stats.map((stat) => (
        <HrStatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
