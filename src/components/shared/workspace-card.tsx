"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";

interface WorkspaceCardProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function WorkspaceCard({
  id,
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  className,
  contentClassName,
}: WorkspaceCardProps) {
  return (
    <Card
      id={id}
      className={cn("flex flex-col border border-border bg-card", className)}
    >
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground leading-none">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </CardHeader>
      <CardContent className={cn("px-4 pb-4 pt-3", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
