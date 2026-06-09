"use client";

import { Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

export function WhatsNewCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg font-bold">Official Motee Tutorial</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          {/* Placeholder — replace src with your YouTube embed URL */}
          <iframe
            className="h-full w-full"
            src="https://www.youtube.com/embed/u31qwQUeGuM"
            title="What's New"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </CardContent>
    </Card>
  );
}
