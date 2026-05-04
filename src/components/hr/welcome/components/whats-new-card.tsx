"use client";

import Link from "next/link";
import { Sparkles, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { WHATS_NEW, NEW_TYPE_COLORS } from "@/src/data/welcome-demo";

export function WhatsNewCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <CardTitle className="text-sm font-medium">What&apos;s New</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-3">
          {WHATS_NEW.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              {/* <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 shrink-0 mt-0.5 ${NEW_TYPE_COLORS[item.type]}`}
              >
                {item.type === "fix"
                  ? "Bug Fix"
                  : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Badge> */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {item.desc}
                </p>
                <Link
                  href={item.link}
                  className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-0.5"
                >
                  Try it <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
