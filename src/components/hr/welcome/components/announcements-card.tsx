"use client";

import Link from "next/link";
import { Megaphone, Pin, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { ANNOUNCEMENTS, TAG_COLORS } from "@/src/data/welcome-demo";

export function AnnouncementsCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Megaphone className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">
              Announcements & Updates
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Pushed by Motee</p>
          </div>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-muted-foreground"
        >
          <Link href="#">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-4">
          {ANNOUNCEMENTS.map((ann, idx) => (
            <div key={ann.id}>
              {idx > 0 && <Separator className="mb-4" />}
              <div className="flex items-start gap-2">
                {ann.pinned && (
                  <Pin className="w-3 h-3 text-primary mt-1 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-medium text-foreground">
                      {ann.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 shrink-0 ${TAG_COLORS[ann.tag]}`}
                    >
                      {ann.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {ann.body}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {ann.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
