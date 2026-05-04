"use client";

import { Building2, BarChart2, CalendarDays, ListOrdered } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import { STATUS_LABELS, STATUS_STYLES } from "../data";
import type { Position } from "../types";

interface Props {
  position: Position | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function PositionDetailModal({ position, open, onOpenChange }: Props) {
  if (!position) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col gap-0 p-0 max-h-[90vh]">
        <DialogHeader className="px-5 pt-16 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
              <ListOrdered className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-sm font-semibold leading-tight">
                {position.title}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {position.department}
              </p>
            </div>
            <Badge
              className={cn(
                "shrink-0 text-[10px] font-medium",
                STATUS_STYLES[position.status],
              )}
            >
              {STATUS_LABELS[position.status]}
            </Badge>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          <DetailRow icon={Building2} label="Department">
            <span>{position.department}</span>
          </DetailRow>

          <DetailRow icon={BarChart2} label="Grade / Level">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
              {position.grade}
            </span>
          </DetailRow>

          <DetailRow icon={CalendarDays} label="Created">
            <span>{position.createdAt}</span>
          </DetailRow>

          {position.description && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground">Description</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {position.description}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
