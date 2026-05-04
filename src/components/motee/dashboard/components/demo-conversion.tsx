"use client";

import { RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { DEMO_CONVERSION_STATS } from "@/src/data/motee-demo";

export function DemoConversionCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">Demo Conversion</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {DEMO_CONVERSION_STATS.map((stat, i) => (
            <div key={stat.label}>
              {i === 2 && <Separator className="col-span-2 my-1" />}
              <div className="flex flex-col gap-0.5 py-1">
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-foreground">
                  {stat.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
