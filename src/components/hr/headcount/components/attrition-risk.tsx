"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { cn } from "@/src/lib/utils";
import { RISK_LABELS, RISK_STYLES } from "../data";
import type { AttritionRisk } from "../types";

interface AttritionRiskTableProps {
  risks: AttritionRisk[];
}

export function AttritionRiskTable({ risks }: AttritionRiskTableProps) {
  if (risks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No attrition risks detected
          </p>
          <p className="text-xs text-muted-foreground">
            All employees appear to be stable based on current indicators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Employee
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Department
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Tenure
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Risk Factors
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Risk Level
                </th>
              </tr>
            </thead>
            <tbody>
              {risks.map((risk) => (
                <tr
                  key={risk.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] font-semibold">
                          {risk.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-none">
                          {risk.employeeName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {risk.jobTitle}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      {risk.department}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      {risk.tenureYears} yr{risk.tenureYears !== 1 ? "s" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {risk.riskFactors.map((factor) => (
                        <span
                          key={factor}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        RISK_STYLES[risk.riskLevel],
                      )}
                    >
                      {RISK_LABELS[risk.riskLevel]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
