"use client";

import { Lightbulb } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { TIPS } from "@/src/data/welcome-demo";

interface TipsCardProps {
  tipIndex: number;
  setTipIndex: (n: number) => void;
}

export function TipsCard({ tipIndex, setTipIndex }: TipsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
          <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <CardTitle className="text-sm font-medium">
          Tips & Best Practices
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="rounded-lg bg-muted/50 p-4 flex flex-col gap-3">
          <p className="text-xs text-foreground leading-relaxed">
            {TIPS[tipIndex]}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {TIPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTipIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === tipIndex ? "bg-primary" : "bg-muted-foreground/30"}`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground px-2"
              onClick={() => setTipIndex((tipIndex + 1) % TIPS.length)}
            >
              Next tip
            </Button>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-medium text-foreground mb-2">
            Quick Resources
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Platform Docs",
              "Release Notes",
              "API Reference",
              "Support Centre",
            ].map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
