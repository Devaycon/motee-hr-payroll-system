"use client";

import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Progress } from "@/src/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Trophy } from "lucide-react";
import type { KudosLeaderboardEntry } from "../types";

interface LeaderboardProps {
  entries: KudosLeaderboardEntry[];
}

const MEDAL_STYLES = [
  "text-yellow-500 font-black",
  "text-slate-400 font-black",
  "text-amber-600 font-black",
];
const PODIUM_STYLES = [
  {
    ring: "ring-yellow-400",
    bg: "bg-yellow-500/10",
    text: "text-yellow-600",
    size: "size-14",
    order: "order-2",
    height: "h-20",
    labelBg: "bg-yellow-400/20",
  },
  {
    ring: "ring-slate-400",
    bg: "bg-slate-500/10",
    text: "text-slate-600",
    size: "size-12",
    order: "order-1",
    height: "h-14",
    labelBg: "bg-slate-400/20",
  },
  {
    ring: "ring-amber-600",
    bg: "bg-amber-700/10",
    text: "text-amber-700",
    size: "size-11",
    order: "order-3",
    height: "h-10",
    labelBg: "bg-amber-600/20",
  },
];

export function Leaderboard({ entries }: LeaderboardProps) {
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const maxKudos = entries[0]?.kudosReceived ?? 1;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Leaderboard
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            This Month
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        {top3.length >= 3 && (
          <div className="flex items-end justify-center gap-3 pt-2 pb-1">
            {[top3[1], top3[0], top3[2]].map((entry, idx) => {
              const rankIdx = idx === 0 ? 1 : idx === 1 ? 0 : 2;
              const style = PODIUM_STYLES[rankIdx];
              return (
                <div
                  key={entry.employeeName}
                  className={`flex flex-col items-center gap-1.5 ${style.order}`}
                >
                  <span className={`text-base ${MEDAL_STYLES[rankIdx]}`}>
                    #{rankIdx + 1}
                  </span>
                  <PersonAvatar
                    name={entry.employeeName}
                    initials={entry.employeeInitials}
                    className={`${style.size} ring-2 ${style.ring} ring-offset-1 ring-offset-background`}
                    fallbackClassName={`font-bold text-sm ${style.bg} ${style.text}`}
                  />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground leading-tight max-w-20 truncate">
                      {entry.employeeName.split(" ")[0]}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.kudosReceived} kudos
                    </p>
                  </div>
                  <div
                    className={`w-16 rounded-t-lg ${style.height} ${style.labelBg} flex items-end justify-center pb-1`}
                  >
                    <span className="text-[10px] font-bold text-muted-foreground">
                      #{rankIdx + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-2.5">
          {rest.map((entry) => {
            const pct = Math.round((entry.kudosReceived / maxKudos) * 100);
            return (
              <div key={entry.employeeName} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4 text-right shrink-0">
                  {entry.rank}
                </span>
                <PersonAvatar
                  name={entry.employeeName}
                  initials={entry.employeeInitials}
                  className="size-7 shrink-0"
                  fallbackClassName="text-[10px] font-bold bg-primary/10 text-primary"
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {entry.employeeName.split(" ")[0]}
                    </p>
                    <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                      {entry.kudosReceived}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-1 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Rankings reset at the start of each month
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
