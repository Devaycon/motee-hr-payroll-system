"use client";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { NEXT_ACTIONS } from "@/src/data/welcome-demo";

export function NextActionsCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
          <Zap className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <CardTitle className="text-sm font-medium">
          Suggested Next Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-2">
          {NEXT_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.link}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0">
                <action.icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm text-foreground flex-1">
                {action.label}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    action.priority === "high"
                      ? "border-red-400/40 bg-red-400/10 text-red-500"
                      : action.priority === "medium"
                        ? "border-[#ff8b2d]/40 bg-[#ff8b2d]/10 text-[#ff8b2d]"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {action.priority}
                </Badge>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
