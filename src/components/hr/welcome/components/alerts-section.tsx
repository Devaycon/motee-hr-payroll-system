"use client";

import { AlertTriangle, X } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ALERTS } from "@/src/data/welcome-demo";

interface AlertsSectionProps {
  dismissedAlerts: string[];
  onDismiss: (id: string) => void;
}

export function AlertsSection({
  dismissedAlerts,
  onDismiss,
}: AlertsSectionProps) {
  const visible = ALERTS.filter((a) => !dismissedAlerts.includes(a.id));

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((alert) => (
        <Card key={alert.id}>
          <CardContent className="flex items-start gap-3 px-4 py-3">
            <AlertTriangle
              className="w-4 h-4 mt-0.5 shrink-0 text-[#ff8b2d]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {alert.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {alert.desc}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground"
                onClick={() => onDismiss(alert.id)}
              >
                <X className="size-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
