"use client";

import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { HELP_RESOURCES } from "@/src/data/welcome-demo";

export function HelpResourcesCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <CardTitle className="text-sm font-medium">Help & Resources</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-2">
          {HELP_RESOURCES.map((res) => (
            <Link
              key={res.label}
              href={res.link}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0">
                <res.icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {res.label}
                </p>
                <p className="text-xs text-muted-foreground">{res.desc}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
