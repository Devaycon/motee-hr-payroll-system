"use client";

import { useState } from "react";
import { Mail, Phone, Building2, MapPin, Pencil, Lock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { DEMO_MY_PROFILE } from "@/src/data/employee-demo";
import { EditRequestModal } from "./edit-request-modal";

const STATUS_STYLES: Record<string, string> = {
  active: "border-[#1D9E75]/30 bg-[#1D9E75]/10 text-[#1D9E75]",
  inactive: "border-slate-400/30 bg-slate-400/10 text-slate-500",
  on_leave: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  terminated: "border-red-500/30 bg-red-500/10 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
  terminated: "Terminated",
};

const EMP_TYPE_STYLES: Record<string, string> = {
  full_time: "border-violet-500/30 bg-violet-500/10 text-violet-600",
  part_time: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  contract: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600",
  intern: "border-pink-500/30 bg-pink-500/10 text-pink-600",
};

const EMP_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  intern: "Intern",
};

export function ProfileSidebar() {
  const p = DEMO_MY_PROFILE;
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="p-5 flex flex-col items-center gap-3">
          <div className="relative mt-1">
            <Avatar className="size-20 ring-2 ring-border">
              <AvatarFallback className="bg-[#7F77DD]/10 text-[#7F77DD] text-2xl font-bold">
                {p.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#7F77DD] flex items-center justify-center shadow-sm">
              <Pencil className="w-3 h-3 text-white" />
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{p.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {p.jobTitle}
            </p>
          </div>

          <Separator />

          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#7F77DD] shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">
                {p.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#7F77DD] shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {p.phone}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-[#7F77DD] shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {p.department}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#7F77DD] shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {p.address.city}, {p.address.country}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-1.5 justify-center">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0.5 font-semibold",
                STATUS_STYLES[p.status] ?? "",
              )}
            >
              {STATUS_LABELS[p.status] ?? p.status}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0.5 font-semibold",
                EMP_TYPE_STYLES[p.employmentType] ?? "",
              )}
            >
              {EMP_TYPE_LABELS[p.employmentType] ?? p.employmentType}
            </Badge>
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs gap-1.5"
            onClick={() => setEditOpen(true)}
          >
            <Lock className="w-3.5 h-3.5" />
            Request Name / ID Change
          </Button>
        </CardContent>
      </Card>

      <EditRequestModal
        open={editOpen}
        onOpenChange={setEditOpen}
        field="name"
      />
    </>
  );
}
