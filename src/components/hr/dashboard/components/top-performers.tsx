"use client";

import { useState, useMemo } from "react";
import { Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { TOP_PERFORMERS } from "@/src/data/dashboard-demo";

export function TopPerformers() {
  const [performerSort, setPerformerSort] = useState("rating");

  const sortedPerformers = useMemo(() => {
    return [...TOP_PERFORMERS].sort((a, b) =>
      performerSort === "rating"
        ? b.rating - a.rating
        : a.name.localeCompare(b.name),
    );
  }, [performerSort]);

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Select value={performerSort} onValueChange={setPerformerSort}>
            <SelectTrigger className="h-7 text-xs w-28 rounded-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">By Rating</SelectItem>
              <SelectItem value="name">By Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col gap-4">
          {sortedPerformers.map((performer) => (
            <div key={performer.id} className="flex items-center gap-3">
              <PersonAvatar
                name={performer.name}
                className="size-9 shrink-0"
                fallbackClassName="bg-primary/10 text-primary text-xs font-semibold"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {performer.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {performer.role} · {performer.workMode}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-xs shrink-0 border-[#4ED251]/40 bg-[#4ED251]/10 text-[#4ED251]"
              >
                {performer.rating}% Rating
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
