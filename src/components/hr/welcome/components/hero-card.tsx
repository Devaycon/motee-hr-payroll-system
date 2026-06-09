"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { PersonAvatar } from "@/src/components/shared/person-avatar";

interface HeroCardProps {
  dateStr: string;
}

export function HeroCard({ dateStr }: HeroCardProps) {
  return (
    <Card>
      <CardContent className="px-6 py-6">
        <div className="flex items-start gap-4">
          <PersonAvatar
            name="Mikovla Stefani"
            initials="MS"
            className="size-14 shrink-0"
            fallbackClassName="bg-primary/10 text-primary text-lg font-bold"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, Mikovla Stefani 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{dateStr}</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl">
              This is your connection point between the Motee platform and your
              HR workspace. Platform announcements, product updates, and support
              requests all flow through here.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <Badge
                variant="outline"
                className="text-xs border-[#4ED251]/40 bg-[#4ED251]/10 text-[#4ED251]"
              >
                HR Admin
              </Badge>
              <Badge variant="outline" className="text-xs">
                Motee HR · v3.1
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
