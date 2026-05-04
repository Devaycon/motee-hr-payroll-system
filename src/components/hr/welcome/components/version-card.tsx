"use client";

import Link from "next/link";
import { Info, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";

export function VersionCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <CardTitle className="text-sm font-medium">
          Version & System Info
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Version</span>
            <Badge variant="outline" className="text-[10px] px-1.5">
              v3.1.0
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Last updated</span>
            <span className="text-xs text-foreground font-medium">
              March 25, 2026
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Environment</span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 border-[#4ED251]/40 bg-[#4ED251]/10 text-[#4ED251]"
            >
              Production
            </Badge>
          </div>
          <Separator className="my-1" />
          <Link
            href="#"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            View full changelog <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
