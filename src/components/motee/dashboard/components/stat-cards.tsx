"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { CMS_STAT_CARDS } from "@/src/data/motee-demo";

export function CmsStatCards() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {CMS_STAT_CARDS.map((stat) => (
        <Card key={stat.label} className="transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#ff8b2d]/10">
                <stat.icon className="w-3.5 h-3.5 text-[#ff8b2d]" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </span>
            </div>
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
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.sub}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5 font-medium gap-0.5",
                  stat.up
                    ? "border-[#4ED251]/40 bg-[#4ED251]/10 text-[#4ED251]"
                    : "border-red-400/30 bg-red-500/10 text-red-500",
                )}
              >
                {stat.trend}
                {stat.up ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
