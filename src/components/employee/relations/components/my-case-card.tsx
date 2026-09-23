"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  CASE_TYPE_CONFIG,
  CASE_STAGE_CONFIG,
  PRIORITY_CONFIG,
  SLA_LABELS,
  SLA_STYLES,
  slaState,
} from "./data";
import type { ERCase } from "./data";

interface Props {
  caseData: ERCase;
}

export function MyCaseCard({ caseData: c }: Props) {
  const typeCfg = CASE_TYPE_CONFIG[c.complaintType];
  const stageCfg = CASE_STAGE_CONFIG[c.stage];
  const priorityCfg = PRIORITY_CONFIG[c.priority];
  const sla = slaState(c);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs text-muted-foreground">
                {c.caseNumber}
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${typeCfg.color} ${typeCfg.bg} ${typeCfg.border}`}
              >
                {typeCfg.label}
              </Badge>
            </div>
            <p className="text-sm text-foreground line-clamp-2">
              {c.description}
            </p>
          </div>
          {c.stage !== "closed" && (
            <Badge
              variant="outline"
              className={`text-xs shrink-0 ${SLA_STYLES[sla]}`}
            >
              {SLA_LABELS[sla]}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge
            variant="outline"
            className={`text-xs ${stageCfg.color} ${stageCfg.bg} ${stageCfg.border}`}
          >
            {stageCfg.label}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${priorityCfg.color} ${priorityCfg.bg} ${priorityCfg.border}`}
          >
            {priorityCfg.label}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            Raised{" "}
            {new Date(c.dateRaised).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
